/**
 * GET /api/nssf/contributions
 * List NSSF contributions (farmer sees own, staff sees all for tenant)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'nssf:read')) {
      return NextResponse.json({ error: 'NSSF read access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const farmerId = searchParams.get('farmerId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = { ...buildTenantFilter(ctx, 'tenantId') }
    if (status) where.status = status
    if (farmerId) where.farmerId = farmerId

    const [data, total] = await Promise.all([
      db.nssfContribution.findMany({
        where,
        include: {
          farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true, phone: true } },
          registration: { select: { nssfNumber: true, nationalId: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.nssfContribution.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error: any) {
    console.error('[nssf/contributions GET] error:', error)
    return NextResponse.json({ error: 'Failed to load contributions' }, { status: 500 })
  }
}
