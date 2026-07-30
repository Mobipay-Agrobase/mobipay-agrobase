import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { headers } from 'next/headers'

/**
 * GET /api/sacco
 *   List all SACCOs for the current tenant.
 *   Supports ?district= filter for Karamoja districts (Abim, Kotido, Karenga, Kaabong).
 *
 * POST /api/sacco
 *   Create a new SACCO. SACCO_ADMIN or SUPER_ADMIN only.
 */

async function writeAudit(args: { userId: string; action: string; entityType?: string; entityId?: string; details?: Record<string, unknown> }) {
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || headersList.get('x-real-ip') || undefined
  await db.auditLog.create({
    data: {
      userId: args.userId,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      details: args.details ? JSON.stringify(args.details) : undefined,
      ipAddress,
    },
  }).catch(err => { console.error('[AuditLog]', err) })
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    if (!hasPermission(ctx.role, 'sacco:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const district = searchParams.get('district')
    const activeOnly = searchParams.get('active') === 'true'

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (district) where.district = district
    if (activeOnly) where.isActive = true

    const saccos = await db.sacco.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { members: true, loans: true, sharePurchases: true, meetings: true },
        },
      },
    })

    return NextResponse.json({
      saccos: saccos.map(s => ({
        ...s,
        memberCount: s._count.members,
        loanCount: s._count.loans,
        meetingCount: s._count.meetings,
      })),
      total: saccos.length,
    })
  } catch (error) {
    console.error('[sacco GET]', error)
    return NextResponse.json({ error: 'Failed to fetch SACCOs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    if (!hasPermission(ctx.role, 'sacco:create')) {
      return NextResponse.json({ error: 'Forbidden — sacco:create permission required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, registrationNo, district, county, subCounty, parish, village,
            meetingFrequency, shareValue, minShares, interestRate, maxLoanMultiplier, establishedAt } = body as {
      name?: string; registrationNo?: string; district?: string; county?: string
      subCounty?: string; parish?: string; village?: string; meetingFrequency?: string
      shareValue?: number; minShares?: number; interestRate?: number; maxLoanMultiplier?: number
      establishedAt?: string
    }

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    // Check for duplicate registration number if provided
    if (registrationNo) {
      const existing = await db.sacco.findUnique({ where: { registrationNo } })
      if (existing) {
        return NextResponse.json({ error: `SACCO with registration number '${registrationNo}' already exists` }, { status: 409 })
      }
    }

    const sacco = await db.sacco.create({
      data: {
        tenantId: ctx.tenantId,
        name: name!,
        registrationNo: registrationNo || null,
        district: district || null,
        county: county || null,
        subCounty: subCounty || null,
        parish: parish || null,
        village: village || null,
        meetingFrequency: meetingFrequency || 'Monthly',
        shareValue: shareValue ?? 10000,
        minShares: minShares ?? 5,
        interestRate: interestRate ?? 12,
        maxLoanMultiplier: maxLoanMultiplier ?? 3,
        establishedAt: establishedAt ? new Date(establishedAt) : null,
      },
    })

    await writeAudit({
      userId: ctx.userId,
      action: 'SACCO_CREATE',
      entityType: 'Sacco',
      entityId: sacco.id,
      details: { name: sacco.name, district: sacco.district, registrationNo: sacco.registrationNo },
    })

    return NextResponse.json({ sacco }, { status: 201 })
  } catch (error) {
    console.error('[sacco POST]', error)
    return NextResponse.json({ error: 'Failed to create SACCO' }, { status: 500 })
  }
}
