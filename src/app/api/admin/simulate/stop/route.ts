import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { headers } from 'next/headers'

/**
 * POST /api/admin/simulate/stop
 *   Ends the active tenant simulation by clearing the `simulate_tenant` cookie.
 *   SUPER_ADMIN only.
 *
 * Audit: writes an AuditLog entry with action='SIMULATE_STOP'.
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

    // Read the existing cookie to record which tenant we were simulating
    const cookie = request.cookies.get('simulate_tenant')?.value
    let simulatedTenantId: string | undefined
    let simulatedTenantName: string | undefined
    if (cookie) {
      try {
        const payload = JSON.parse(
          Buffer.from(cookie, 'base64url').toString('utf-8'),
        ) as {
          tenantId?: string
          tenantName?: string
          startedAt?: number
        }
        simulatedTenantId = payload.tenantId
        simulatedTenantName = payload.tenantName
      } catch {
        // ignore malformed cookie
      }
    }

    if (simulatedTenantId) {
      const headersList = await headers()
      const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headersList.get('x-real-ip') || undefined
      await db.auditLog.create({
        data: {
          userId: ctx.userId,
          action: 'SIMULATE_STOP',
          entityType: 'Tenant',
          entityId: simulatedTenantId,
          details: JSON.stringify({
            tenantName: simulatedTenantName,
          }),
          ipAddress,
        },
      })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete('simulate_tenant')
    return response
  } catch (error) {
    console.error('[simulate/stop]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to stop simulation' },
      { status: 500 },
    )
  }
}
