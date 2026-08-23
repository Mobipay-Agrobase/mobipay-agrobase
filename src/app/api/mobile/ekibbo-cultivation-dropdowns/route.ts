import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId, resolveFarmerByNumericId } from '@/lib/mobile/ekibbo-adapter'

/**
 * GET /api/mobile/ekibbo-cultivation-dropdowns?farmerId=<numeric>
 *
 * Cultivation-form dropdowns from the WEB masters (SeasonMaster, CropMaster,
 * CropVariety) + the farmer's farm lands, in the upstream mobile shape:
 *   { result, data: {
 *       season: [{id, season_name, name}],
 *       crop_information: [{id, name}],        // CropMaster
 *       crop_variety: [{id, name, crop_id}],   // CropVariety per crop
 *       farm_land: [{id, farm_name, ...}] } }
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { searchParams } = new URL(req.url)
    const farmerNumId = searchParams.get('farmerId')

    const [seasons, crops, varieties] = await Promise.all([
      db.seasonMaster.findMany({
        select: { id: true, name: true },
        orderBy: { fromDate: 'desc' },
        take: 50,
      }),
      db.cropMaster.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
        take: 100,
      }),
      db.cropVariety.findMany({
        select: { id: true, name: true, cropId: true },
        orderBy: { name: 'asc' },
        take: 300,
      }),
    ])

    let farmLands: Array<Record<string, unknown>> = []
    if (farmerNumId) {
      const numId = parseInt(farmerNumId, 10)
      if (!Number.isNaN(numId)) {
        const farmer = await resolveFarmerByNumericId(tf, numId)
        if (farmer) {
          const lands = await db.farmLand.findMany({
            where: { farmerId: farmer.id },
            select: { id: true, name: true, sizeHectares: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
          farmLands = lands.map(l => ({
            id: numericId(l.id),
            farm_name: l.name,
            farmer_id: numId,
            total_land_holding: Number(l.sizeHectares) || 0,
            actual_area: String(l.sizeHectares ?? 0),
            total_cultivation: 0,
            tag: '',
            listLatLng: '',
          }))
        }
      }
    }

    return NextResponse.json({
      result: true,
      data: {
        season: seasons.map(s => ({ id: numericId(s.id), season_name: s.name, name: s.name })),
        crop_information: crops.map(c => ({ id: numericId(c.id), name: c.name })),
        crop_variety: varieties.map(v => ({
          id: numericId(v.id),
          name: v.name,
          crop_id: numericId(v.cropId),
        })),
        farm_land: farmLands,
      },
    })
  } catch (error: any) {
    console.error('[ekibbo-cultivation-dropdowns]', error)
    return NextResponse.json({ result: false, message: 'Failed to load dropdowns' }, { status: 500 })
  }
}
