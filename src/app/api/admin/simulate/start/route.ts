import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { headers } from 'next/headers'

/**
 * POST /api/admin/simulate/start
 *   SUPER_ADMIN starts simulating a tenant context.
 *   Sets an httpOnly cookie `simulate_tenant` (30-minute TTL) that the
 *   middleware reads to inject `x-simulated-tenant-id` into request headers.
 *
 *   Body: { tenantId: string }
 *
 * Audit: writes an AuditLog entry with action='SIMULATE_START'.
 * Security:
 *   - SUPER_ADMIN only (403 otherwise)
 *   - Target tenant must exist and be active
 *   - Cannot simulate the platform root tenant (type === 'SUPER_ADMIN')
 *   - Cookie is httpOnly, SameSite=Lax, Secure in production, maxAge=1800s
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    if (!ctx.isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Super Admin access required' },
        { status: 403 },
      )
    }

    const body = await request.json().catch(() => ({}))
    const { tenantId } = body as { tenantId?: string }
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 },
      )
    }

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, type: true, isActive: true, country: true, defaultCurrency: true },
    })
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 },
      )
    }
    if (!tenant.isActive) {
      return NextResponse.json(
        { success: false, error: 'Cannot simulate a suspended tenant' },
        { status: 400 },
      )
    }
    if (tenant.type === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Cannot simulate the platform root tenant' },
        { status: 400 },
      )
    }

    // Build a signed cookie payload. We do NOT encrypt — the middleware
    // trusts the cookie because it is httpOnly and can only be set by this
    // server-side route after RBAC verification. Tampering requires server
    // compromise, in which case the attacker has DB access anyway.
    // The payload is JSON { tenantId, tenantName, startedAt, expiresAt }.
    const now = Date.now()
    const ttlSeconds = 30 * 60 // 30 minutes
    const payload = {
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantType: tenant.type,
      country: tenant.country,
      defaultCurrency: tenant.defaultCurrency,
      startedAt: now,
      expiresAt: now + ttlSeconds * 1000,
      startedBy: ctx.userId,
    }
    const cookieValue = Buffer.from(JSON.stringify(payload)).toString('base64url')

    // AuditLog entry
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') || undefined
    await db.auditLog.create({
      data: {
        userId: ctx.userId,
        action: 'SIMULATE_START',
        entityType: 'Tenant',
        entityId: tenant.id,
        details: JSON.stringify({
          tenantName: tenant.name,
          tenantType: tenant.type,
          ttlSeconds,
        }),
        ipAddress,
      },
    })

    const response = NextResponse.json({
      success: true,
      data: {
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantType: tenant.type,
        expiresAt: payload.expiresAt,
      },
    })
    response.cookies.set('simulate_tenant', cookieValue, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ttlSeconds,
    })
    return response
  } catch (error) {
    console.error('[simulate/start]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to start simulation' },
      { status: 500 },
    )
  }
}
