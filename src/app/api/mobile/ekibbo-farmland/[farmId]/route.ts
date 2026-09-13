import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId, resolveFarmerByNumericId } from '@/lib/mobile/ekibbo-adapter'
import { farmerSelfAccess } from '@/lib/mobile/ekibbo-mobile-utils'

// Second review (G): neighbouring physical features — JSON array safe parse
function safeJsonArr(raw: string | null): string[] {
  if (!raw) return []
  try {
    const p = JSON.parse(raw)
    return Array.isArray(p) ? p.map(String) : []
  } catch { return [] }
}

// Arrays are JSON.stringified; strings pass through as-is.
function toJsonOrString(v: any): string | null | undefined {
  if (v === undefined) return undefined
  if (v == null || v === '') return null
  if (Array.isArray(v)) return JSON.stringify(v)
  return String(v)
}


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
      select: { id: true, farmerId: true },
      take: 5000,
    })
    const match = all.find(f => numericId(f.id) === numId)
    if (!match) {
      return NextResponse.json({ result: false, message: 'Farm land not found' }, { status: 404 })
    }

    // Farmer self-scope: farmers may only view their OWN farm lands.
    if (!(await farmerSelfAccess(ctx, match.farmerId))) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }

    const land = await db.farmLand.findFirst({
      where: { id: match.id },
      select: {
        id: true, name: true, sizeHectares: true, landOwnership: true,
        neighbouringFeatures: true, accessMapLat: true, accessMapLng: true,
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
          neighbouring_features: safeJsonArr(land.neighbouringFeatures),
          access_map: { lat: land.accessMapLat, lng: land.accessMapLng },
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
      select: { id: true, farmerId: true },
      take: 5000,
    })
    const match = all.find(f => numericId(f.id) === numId)
    if (!match) {
      return NextResponse.json({ result: false, message: 'Farm land not found' }, { status: 404 })
    }

    // Farmer self-scope: farmers may only edit their OWN farm lands.
    if (!(await farmerSelfAccess(ctx, match.farmerId))) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }

    // The mobile app sends MULTIPART FormData (photos + snake_case fields,
    // the upstream FarmLandModel.toMap() shape); the web form sends JSON with
    // camelCase keys. Parse BOTH.
    const body: Record<string, any> = {}
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('multipart/form-data')) {
      const form = await req.formData()
      for (const [k, v] of form.entries()) {
        if (typeof v === 'string') body[k] = v
      }
    } else {
      Object.assign(body, await req.json().catch(() => ({})))
    }

    const toNum = (v: any): number | undefined => {
      if (v == null || v === '') return undefined
      const n = Number(v)
      return Number.isNaN(n) ? undefined : n
    }

    await db.farmLand.update({
      where: { id: match.id },
      data: {
        name: body.name ?? body.farm_name ?? undefined,
        // Mobile sends total_land_holding (ha); web sends sizeHectares.
        sizeHectares: toNum(body.sizeHectares ?? body.total_land_holding) ?? undefined,
        landOwnership: body.landOwnership ?? body.land_ownership ?? undefined,
        // Second review (G): neighbouring features + access map
        neighbouringFeatures: body.neighbouringFeatures !== undefined || body.neighbouring_features !== undefined
          ? toJsonOrString(body.neighbouringFeatures ?? body.neighbouring_features) : undefined,
        accessMapLat: toNum(body.accessMapLat ?? body.access_map?.lat) ?? undefined,
        accessMapLng: toNum(body.accessMapLng ?? body.access_map?.lng) ?? undefined,
        soilFertility: body.soilFertility ?? body.soil_fertility ?? undefined,
        irrigationType: body.irrigationType ?? body.irrigation_type ?? undefined,
        fullTimeWorkers: toNum(body.fullTimeWorkers ?? body.full_time_workers),
        partTimeWorkers: toNum(body.partTimeWorkers ?? body.part_time_workers),
        seasonalWorkers: toNum(body.seasonalWorkers ?? body.seasonal_workers),
        familyWorkers: toNum(body.familyWorkers ?? body.family_workers),
        estYieldKg: toNum(body.estYieldKg ?? body.est_yield),
        // Organic/conversion info (web-form parity — was dropped by the
        // mobile update endpoint before; null clears, undefined = untouched)
        conventionalCrops: body.conventionalCrops !== undefined || body.conventional_crops !== undefined
          ? toJsonOrString(body.conventionalCrops ?? body.conventional_crops) : undefined,
        conventionalLands: body.conventionalLands !== undefined || body.conventional_lands !== undefined
          ? toJsonOrString(body.conventionalLands ?? body.conventional_lands) : undefined,
        fallowPastureLand: body.fallowPastureLand !== undefined || body.fallow_pasture_land !== undefined
          ? toJsonOrString(body.fallowPastureLand ?? body.fallow_pasture_land) : undefined,
        latitude: toNum(body.lat) ?? undefined,
        longitude: toNum(body.lng) ?? undefined,
      },
    })

    return NextResponse.json({ result: true, message: 'Updated' })
  } catch (error: any) {
    console.error('[ekibbo-farmland/[farmId] PUT]', error)
    return NextResponse.json({ result: false, message: 'Update failed' }, { status: 500 })
  }
}
