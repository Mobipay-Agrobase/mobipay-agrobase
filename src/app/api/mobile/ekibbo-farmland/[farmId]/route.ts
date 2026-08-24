import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId, resolveFarmerByNumericId } from '@/lib/mobile/ekibbo-adapter'

/**
 * GET /api/mobile/ekibbo-farmland/[farmId]
 * PUT /api/mobile/ekibbo-farmland/[farmId]  (update)
 *
 * Farm land detail in the upstream FarmlandDetailResponse shape:
 *   { result, data: { farm_land_data: {...}, farm_land_ploting: [...] } }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ farmId: string }> },
) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { farmId } = await params
    const numId = parseInt(farmId, 10)

    // Resolve numeric → real farm land (tenant-scoped via farmer)
    const all = await db.farmLand.findMany({
      where: { farmer: { ...tf } },
      select: { id: true },
      take: 5000,
    })
    const match = all.find(f => numericId(f.id) === numId)
    if (!match) {
      return NextResponse.json({ result: false, message: 'Farm land not found' }, { status: 404 })
    }

    const land = await db.farmLand.findFirst({
      where: { id: match.id },
      select: {
        id: true, name: true, sizeHectares: true, landOwnership: true,
        landSurveyNo: true, waterSource: true, powerSource: true,
        soilFertility: true, irrigationType: true, estYieldKg: true,
        fullTimeWorkers: true, partTimeWorkers: true,
        seasonalWorkers: true, familyWorkers: true,
        farmerId: true, latitude: true, longitude: true,
        polygonPoints: { select: { id: true, latitude: true, longitude: true, pointOrder: true } },
      },
    })
    if (!land) {
      return NextResponse.json({ result: false, message: 'Farm land not found' }, { status: 404 })
    }

    return NextResponse.json({
      result: true,
      data: {
        farm_land_data: {
          id: numericId(land.id),
          farm_name: land.name,
          farmer_id: numericId(land.farmerId),
          total_land_holding: Number(land.sizeHectares) || 0,
          actual_area: String(land.sizeHectares ?? 0),
          land_ownership: land.landOwnership,
          land_survey_no: land.landSurveyNo,
          water_source: land.waterSource,
          power_source: land.powerSource,
          soil_fertility: land.soilFertility,
          irrigation_type: land.irrigationType,
          est_yield: land.estYieldKg,
          full_time_workers: land.fullTimeWorkers,
          part_time_workers: land.partTimeWorkers,
          seasonal_workers: land.seasonalWorkers,
          family_workers: land.familyWorkers,
          total_cultivation: 0,
          tag: '',
          listLatLng: '',
        },
        farm_land_ploting: land.polygonPoints.map(p => ({
          id: numericId(p.id),
          lat: p.latitude?.toString() ?? '',
          lng: p.longitude?.toString() ?? '',
        })),
      },
    })
  } catch (error: any) {
    console.error('[ekibbo-farmland/[farmId] GET]', error)
    return NextResponse.json({ result: false, message: 'Failed to load farm land' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ farmId: string }> },
) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { farmId } = await params
    const numId = parseInt(farmId, 10)

    const all = await db.farmLand.findMany({
      where: { farmer: { ...tf } },
      select: { id: true },
      take: 5000,
    })
    const match = all.find(f => numericId(f.id) === numId)
    if (!match) {
      return NextResponse.json({ result: false, message: 'Farm land not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    await db.farmLand.update({
      where: { id: match.id },
      data: {
        name: body.name ?? body.farm_name ?? undefined,
        sizeHectares: body.sizeHectares ? Number(body.sizeHectares) : undefined,
        landOwnership: body.landOwnership ?? body.land_ownership ?? undefined,
        landSurveyNo: body.landSurveyNo ?? body.land_survey_no ?? undefined,
        waterSource: body.waterSource ?? body.water_source ?? undefined,
        powerSource: body.powerSource ?? body.power_source ?? undefined,
        soilFertility: body.soilFertility ?? body.soil_fertility ?? undefined,
        irrigationType: body.irrigationType ?? body.irrigation_type ?? undefined,
      },
    })

    return NextResponse.json({ result: true, message: 'Updated' })
  } catch (error: any) {
    console.error('[ekibbo-farmland/[farmId] PUT]', error)
    return NextResponse.json({ result: false, message: 'Update failed' }, { status: 500 })
  }
}
