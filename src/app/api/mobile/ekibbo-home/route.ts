import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { isMobileStaff } from '@/lib/mobile/ekibbo-mobile-utils'
import { mapFarmer, farmerSelect } from '@/lib/mobile/ekibbo-adapter'

/**
 * GET /api/mobile/ekibbo-home
 *
 * Field Officer (staff) dashboard in the upstream JSON shape:
 *   { result, data: { total_farmmer, total_hectares, total_plot, farmer_list } }
 *
 * lat/lng query params from the app are accepted and ignored (weather is
 * fetched separately by the client from weatherapi.com).
 * Tenant-scoped via Bearer-token context.
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!isMobileStaff(ctx.role)) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }
    const tf = buildTenantFilter(ctx, 'tenantId')

    const [farmerCount, lands, farmers] = await Promise.all([
      db.farmerProfile.count({ where: { ...tf, status: 'ACTIVE' } }),
      db.farmLand.findMany({
        where: { farmer: { ...tf } },
        select: { sizeHectares: true },
      }),
      db.farmerProfile.findMany({
        where: { ...tf, status: 'ACTIVE' },
        select: farmerSelect,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    const totalHectares = lands.reduce((s, l) => s + (Number(l.sizeHectares) || 0), 0)

    return NextResponse.json({
      result: true,
      data: {
        total_farmmer: farmerCount,
        total_hectares: Math.round(totalHectares * 100) / 100,
        total_plot: lands.length,
        farmer_list: farmers.map(f => mapFarmer(f as any)),
      },
    })
  } catch (error) {
    console.error('[ekibbo-home]', error)
    return NextResponse.json({ result: false, message: 'Failed to load dashboard' }, { status: 500 })
  }
}
