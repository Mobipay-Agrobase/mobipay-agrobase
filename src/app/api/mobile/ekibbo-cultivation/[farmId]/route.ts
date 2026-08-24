import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId } from '@/lib/mobile/ekibbo-adapter'

/**
 * GET /api/mobile/ekibbo-cultivation/[farmId]
 *
 * Cultivations of one farm land (numeric id), in the upstream mobile
 * AllCutivationResponse shape:
 *   { result, data: { cultivation: [ {
 *       id, farm_land_id, crop_name, crop_variety, sowing_date,
 *       expect_date, est_yield, crops_master: {id, name},
 *       season: {id, season_name}, photo, photo_url } ] } }
 *
 * Served from the WEB PLATFORM's Cultivation table — the same rows the web
 * cultivation list shows, so mobile and web stay in parity.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ farmId?: string }> },
) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const p = params ? await params : {}
    const farmNumId = p.farmId ? parseInt(p.farmId, 10) : NaN
    if (Number.isNaN(farmNumId)) {
      return NextResponse.json({ result: false, message: 'Invalid farm id' }, { status: 400 })
    }

    // Resolve the numeric farm id → the tenant-scoped FarmLand row.
    const farms = await db.farmLand.findMany({
      where: { farmer: { ...tf } },
      select: { id: true },
      take: 10000,
    })
    const farm = farms.find(f => numericId(f.id) === farmNumId)
    if (!farm) {
      return NextResponse.json({ result: true, data: { cultivation: [] } })
    }

    const rows = await db.cultivation.findMany({
      where: { farmId: farm.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Resolve season names back to mobile season objects.
    const seasons = await db.seasonMaster.findMany({
      select: { id: true, name: true },
      take: 100,
    })

    return NextResponse.json({
      result: true,
      data: {
        cultivation: rows.map(c => {
          const season = seasons.find(s => s.name === c.season)
          return {
            id: numericId(c.id),
            farm_land_id: farmNumId,
            crop_name: c.cropName,
            crop_variety: c.variety ?? '',
            sowing_date: c.sowingDate ? formatDdMmYyyy(c.sowingDate) : null,
            expect_date: null,
            est_yield: c.estimatedYield != null ? String(c.estimatedYield) : null,
            crops_master: { id: numericId(`crop:${c.cropName}`), name: c.cropName },
            season: season
              ? { id: numericId(season.id), season_name: season.name, name: season.name }
              : null,
            photo: null,
            photo_url: c.photoUrl ?? null,
          }
        }),
      },
    })
  } catch (error: any) {
    console.error('[ekibbo-cultivation]', error)
    return NextResponse.json({ result: false, message: 'Failed to load cultivations' }, { status: 500 })
  }
}

function formatDdMmYyyy(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}
