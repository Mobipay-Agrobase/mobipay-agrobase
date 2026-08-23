import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId } from '@/lib/mobile/ekibbo-adapter'
import { isMobileStaff } from '@/lib/mobile/ekibbo-mobile-utils'

/**
 * GET /api/mobile/ekibbo-crop-dropdowns[?farmerId=<numeric>]
 *
 * Season + crop dropdowns for the mobile farm-land / cultivation forms,
 * served from the WEB PLATFORM's master data (Season Master, Crop Master)
 * so mobile and web always show the same reference data:
 *   { result, data: {
 *       season: [{ id, season_name }],
 *       crop_information: [{ id, name }],
 *       farm_land: [{ id, farm_name, farmer_id, ... }]
 *   } }
 *
 * farm_land: when farmerId (numeric) is provided, that farmer's registered
 * farm lands (for the cultivation form's land picker).
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!isMobileStaff(ctx.role)) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { searchParams } = new URL(req.url)
    const farmerNumId = searchParams.get('farmerId')

    // Season/Crop Masters are GLOBAL reference tables (no tenantId — same as
    // the web /api/master route, which also queries them unscoped).
    const [seasons, crops] = await Promise.all([
      db.seasonMaster.findMany({
        select: { id: true, name: true, fromDate: true },
        orderBy: { fromDate: 'desc' },
        take: 50,
      }),
      db.cropMaster.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
        take: 100,
      }),
    ])

    // Optional: the farmer's farm lands for the land picker
    let farmLands: Record<string, unknown>[] = []
    if (farmerNumId) {
      const numId = parseInt(farmerNumId, 10)
      if (!Number.isNaN(numId)) {
        const all = await db.farmerProfile.findMany({
          where: { ...tf },
          select: { id: true, farms: { select: { id: true, name: true, sizeHectares: true } } },
          take: 5000,
        })
        const match = all.find(f => numericId(f.id) === numId)
        if (match) {
          farmLands = match.farms.map(l => ({
            id: numericId(l.id),
            farm_name: l.name,
            farmer_id: numId,
            total_land_holding: Number(l.sizeHectares) || 0,
            total_cultivation: 0,
            actual_area: String(l.sizeHectares ?? 0),
            tag: '',
            listLatLng: '',
          }))
        }
      }
    }

    return NextResponse.json({
      result: true,
      data: {
        season: seasons.map(s => ({ id: numericId(s.id), season_name: s.name })),
        crop_information: crops.map(c => ({ id: numericId(c.id), name: c.name })),
        farm_land: farmLands,
      },
    })
  } catch (error) {
    console.error('[ekibbo-crop-dropdowns]', error)
    return NextResponse.json({ result: false, message: 'Failed to load dropdowns' }, { status: 500 })
  }
}
