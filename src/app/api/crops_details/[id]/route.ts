import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId } from '@/lib/mobile/ekibbo-adapter'

/**
 * GET /api/crops_details/[id]
 *
 * Mobile crop detail (upstream path). Returns the WEB PLATFORM Cultivation
 * row in the mobile CropResponse shape:
 *   { result, data: {
 *       cultivation_data: {…},
 *       season_master: [{id, season_name, name}],
 *       crop_master: [{id, name}],
 *       farm_land: [{id, farm_name, …}],
 *       carbon_emission_id: null } }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id?: string }> },
) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const p = params ? await params : {}
    const cropNumId = p.id ? parseInt(p.id, 10) : NaN
    if (Number.isNaN(cropNumId)) {
      return NextResponse.json({ result: false, message: 'Invalid crop id' }, { status: 400 })
    }

    const rows = await db.cultivation.findMany({
      where: { farm: { farmer: { ...tf } } },
      include: { farm: { select: { id: true, name: true, sizeHectares: true, farmerId: true } } },
      take: 20000,
    })
    const row = rows.find(r => numericId(r.id) === cropNumId)
    if (!row) {
      return NextResponse.json({ result: false, message: 'Cultivation not found' }, { status: 404 })
    }

    const [seasons, crops] = await Promise.all([
      db.seasonMaster.findMany({ select: { id: true, name: true }, take: 100 }),
      db.cropMaster.findMany({ select: { id: true, name: true }, take: 500 }),
    ])
    const season = seasons.find(s => s.name === row.season)

    return NextResponse.json({
      result: true,
      data: {
        cultivation_data: {
          id: numericId(row.id),
          farm_land_id: numericId(row.farmId),
          crop_name: row.cropName,
          crop_variety: row.variety ?? '',
          sowing_date: row.sowingDate ? formatDdMmYyyy(row.sowingDate) : null,
          expect_date: null,
          est_yield: row.estimatedYield != null ? String(row.estimatedYield) : null,
          crops_master: { id: numericId(`crop:${row.cropName}`), name: row.cropName },
          season: season
            ? { id: numericId(season.id), season_name: season.name, name: season.name }
            : null,
          photo: null,
          photo_url: row.photoUrl ?? null,
        },
        season_master: seasons.map(s => ({
          id: numericId(s.id), season_name: s.name, name: s.name,
        })),
        crop_master: crops.map(c => ({ id: numericId(c.id), name: c.name })),
        farm_land: [
          {
            id: numericId(row.farm.id),
            farm_name: row.farm.name,
            farmer_id: numericId(row.farm.farmerId),
            total_land_holding: Number(row.farm.sizeHectares) || 0,
            actual_area: String(row.farm.sizeHectares ?? 0),
            total_cultivation: 0,
            tag: '',
            listLatLng: '',
          },
        ],
        carbon_emission_id: null,
      },
    })
  } catch (error: any) {
    console.error('[crops_details]', error)
    return NextResponse.json({ result: false, message: 'Failed to load crop' }, { status: 500 })
  }
}

function formatDdMmYyyy(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}
