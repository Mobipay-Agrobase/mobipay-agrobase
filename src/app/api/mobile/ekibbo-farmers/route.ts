import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { isMobileStaff } from '@/lib/mobile/ekibbo-mobile-utils'
import { mapFarmer, farmerSelect } from '@/lib/mobile/ekibbo-adapter'

/**
 * GET /api/mobile/ekibbo-farmers?search=&page=&per_page=
 *
 * Paginated farmer registry for the Field Officer list screen.
 *
 * shape is decided by the `page` query param (both mobile callers hit this
 * endpoint with different models):
 *   page present → upstream paginated envelope:
 *     { result, data: { farmer_data: { data: [...], current_page, last_page } } }
 *   page absent  → upstream flat search envelope:
 *     { result, data: { farmer_data: [...] } }
 *
 * Tenant-scoped via Bearer-token context.
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!isMobileStaff(ctx.role)) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { searchParams } = new URL(req.url)

    const pageParam = searchParams.get('page')
    const isPaged = pageParam != null && pageParam !== ''
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.min(50, parseInt(searchParams.get('per_page') || '10') || 10)
    const search = (searchParams.get('search') || '').trim()

    const where: Record<string, unknown> = { ...tf, status: 'ACTIVE' }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { farmerCode: { contains: search, mode: 'insensitive' } },
        { villageName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [farmers, total] = await Promise.all([
      db.farmerProfile.findMany({
        where,
        select: farmerSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.farmerProfile.count({ where }),
    ])

    const mapped = farmers.map(f => mapFarmer(f as any))

    if (!isPaged) {
      return NextResponse.json({ result: true, data: { farmer_data: mapped } })
    }
    return NextResponse.json({
      result: true,
      data: {
        farmer_data: {
          data: mapped,
          current_page: page,
          last_page: Math.max(1, Math.ceil(total / limit)),
        },
      },
    })
  } catch (error) {
    console.error('[ekibbo-farmers]', error)
    return NextResponse.json({ result: false, message: 'Failed to fetch farmers' }, { status: 500 })
  }
}
