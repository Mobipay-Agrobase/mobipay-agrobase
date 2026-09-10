import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId, resolveFarmerByNumericId } from '@/lib/mobile/ekibbo-adapter'
import { farmerSelfAccess, isFarmerRole } from '@/lib/mobile/ekibbo-mobile-utils'

// Second review (G): neighbouring physical features — JSON array safe parse
function safeJsonArr(raw: string | null): string[] {
  if (!raw) return []
  try {
    const p = JSON.parse(raw)
    return Array.isArray(p) ? p.map(String) : []
  } catch { return [] }
}


/**
 * GET /api/mobile/ekibbo-farmlands/[farmerId]
 * GET /api/mobile/ekibbo-farmlands (staff — all tenant)
 *
 * List farm lands for a farmer (or all staff-visible) in the upstream
 * AllFarmLandResponse shape:
 *   { result, data: { farm_land_data: [{id, farm_name, ...}] } }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ farmerId?: string }> },
) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const p = params ? await params : {}
    const farmerNumId = p.farmerId ? parseInt(p.farmerId, 10) : null

    let farmerRealId: string | null = null
    if (farmerNumId && !Number.isNaN(farmerNumId)) {
      const farmer = await resolveFarmerByNumericId(tf, farmerNumId)
      farmerRealId = farmer?.id ?? null
    }

    // Farmer self-scope: farmers must request THEIR OWN farmlands; the
    // tenant-wide listing branch is staff-only.
    if (isFarmerRole(ctx.role)) {
      if (!farmerRealId || !(await farmerSelfAccess(ctx, farmerRealId))) {
        return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
      }
    }

    const lands = await db.farmLand.findMany({
      where: farmerRealId
        ? { farmerId: farmerRealId }
        : { farmer: { ...tf } },
      select: {
        id: true, name: true, sizeHectares: true, landOwnership: true,
        neighbouringFeatures: true, accessMapLat: true, accessMapLng: true,
        soilFertility: true, irrigationType: true, estYieldKg: true,
        fullTimeWorkers: true, partTimeWorkers: true,
        seasonalWorkers: true, familyWorkers: true,
        farmerId: true, latitude: true, longitude: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({
      result: true,
      data: {
        farm_land_data: lands.map(l => ({
          id: numericId(l.id),
          farm_name: l.name,
          farmer_id: numericId(l.farmerId),
          total_land_holding: Number(l.sizeHectares) || 0,
          actual_area: String(l.sizeHectares ?? 0),
          land_ownership: l.landOwnership,
          neighbouring_features: safeJsonArr(l.neighbouringFeatures),
          access_map: { lat: l.accessMapLat, lng: l.accessMapLng },
          soil_fertility: l.soilFertility,
          irrigation_type: l.irrigationType,
          est_yield: l.estYieldKg,
          full_time_workers: l.fullTimeWorkers,
          part_time_workers: l.partTimeWorkers,
          seasonal_workers: l.seasonalWorkers,
          family_workers: l.familyWorkers,
          total_cultivation: 0,
          tag: '',
          listLatLng: '',
          lat: l.latitude?.toString() ?? '',
          lng: l.longitude?.toString() ?? '',
        })),
      },
    })
  } catch (error: any) {
    console.error('[ekibbo-farmlands]', error)
    return NextResponse.json({ result: false, message: 'Failed to load farm lands' }, { status: 500 })
  }
}
