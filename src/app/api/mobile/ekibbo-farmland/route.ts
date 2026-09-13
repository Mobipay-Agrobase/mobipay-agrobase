import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId, resolveFarmerByNumericId } from '@/lib/mobile/ekibbo-adapter'
import { resolveCropMasterId } from '@/lib/farm-plant-crop-link'

// Second review (G): neighbouring physical features — JSON array safe parse
function safeJsonArr(raw: string | null): string[] {
  if (!raw) return []
  try {
    const p = JSON.parse(raw)
    return Array.isArray(p) ? p.map(String) : []
  } catch { return [] }
}


/**
 * /api/mobile/ekibbo-farmland
 *
 * GET  ?farmerId=<numeric> — farm-land dropdowns (web CatalogMaster) + the
 *      farmer's registered farm lands, in the upstream mobile shapes:
 *        { result, data: {
 *            data_land_owner_ship: [{ID,NAME,name}],
 *            data_land_topolog, data_land_gradient,
 *            data_appoarch_road, data_water_source, data_power_source,
 *            data_soil_fertility, data_irrigation_type, data_irrigation_source,
 *            all_farmer: [...], farm_lands: [...] } }
 *
 * POST — create a farm land with ALL web datapoints (FarmLandFormPage parity):
 *      multipart (photos) or JSON. Body keys mirror the web form:
 *        farmerId (numeric), name, sizeHectares, landOwnership, landSurveyNo,
 *        approachRoad[], landTopology, landGradient[], waterSource,
 *        powerSource, soilFertility, irrigationType, irrigationSource[],
 *        fullTimeWorkers/partTimeWorkers/seasonalWorkers/familyWorkers,
 *        lastChemicalApplicationDate, estYieldKg, lat, lng, polygonPoints[],
 *        conventionalCrops, conventionalLands, fallowPastureLand, certType,
 *        conversionStatus, conversionDate, inspectorName,
 *        conversionQualified, conversionRemarks
 *      Optional plant inventory rows (UAT feedback — "add plant type details"
 *      directly at plot registration instead of a second visit to the
 *      detail screen's Plants tab):
 *        plants[0][crop_category]=Coffee, plants[0][variety]=Robusta,
 *        plants[0][plant_count]=120, plants[0][notes]=…
 *      or JSON `plants: [{ cropCategory, variety, plantCount, notes }]`.
 */

const LAND_CATS = [
  'land_ownership', 'land_topology', 'land_gradient', 'approach_road',
  'water_source', 'power_source', 'soil_fertility', 'irrigation_type',
  'irrigation_source', 'land_document',
]

function cat(items: Array<{ category: string; value: string; label: string | null }>, category: string) {
  const seen = new Set<string>()
  const out: Array<{ ID: number; NAME: string; name: string }> = []
  for (const i of items) {
    if (i.category !== category || seen.has(i.value)) continue
    seen.add(i.value)
    out.push({ ID: out.length + 1, NAME: i.label || i.value, name: i.value })
  }
  return out
}

const toJsonOrString = (v: any): string | null => {
  if (v == null || v === '') return null
  if (Array.isArray(v)) return v.length ? JSON.stringify(v) : null
  return String(v)
}
const toNum = (v: any): number | null => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { searchParams } = new URL(req.url)
    const farmerNumId = searchParams.get('farmerId')

    const catalog = await db.catalogMaster.findMany({
      where: { isActive: true, category: { in: LAND_CATS } },
      select: { category: true, value: true, label: true },
      orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
      take: 1200,
    })

    // The farmer's lands (upstream shape) + farmer stub for pickers
    let allFarmer: Array<Record<string, unknown>> = []
    let farmLands: Array<Record<string, unknown>> = []
    let farmerRealId: string | null = null

    if (farmerNumId) {
      const numId = parseInt(farmerNumId, 10)
      const farmer = Number.isNaN(numId) ? null : await resolveFarmerByNumericId(tf, numId)
      if (farmer) {
        farmerRealId = farmer.id
        const lands = await db.farmLand.findMany({
          where: { farmerId: farmer.id },
          select: {
            id: true, name: true, sizeHectares: true, landOwnership: true,
            neighbouringFeatures: true, accessMapLat: true, accessMapLng: true,
            soilFertility: true, irrigationType: true, estYieldKg: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
        farmLands = lands.map(l => ({
          id: numericId(l.id),
          farm_name: l.name,
          farmer_id: numId,
          total_land_holding: Number(l.sizeHectares) || 0,
          actual_area: String(l.sizeHectares ?? 0),
          land_ownership: l.landOwnership,
          neighbouring_features: safeJsonArr(l.neighbouringFeatures),
          access_map: { lat: l.accessMapLat, lng: l.accessMapLng },
          soil_fertility: l.soilFertility,
          irrigation_type: l.irrigationType,
          est_yield: l.estYieldKg,
          total_cultivation: 0,
          tag: '',
          listLatLng: '',
        }))
        allFarmer = [{
          id: numId,
          full_name: `${(farmer as any).firstName} ${(farmer as any).lastName}`.trim(),
        }]
      }
    }

    return NextResponse.json({
      result: true,
      data: {
        data_land_owner_ship: cat(catalog, 'land_ownership'),
        data_land_topolog: cat(catalog, 'land_topology'),
        data_land_gradient: cat(catalog, 'land_gradient'),
        data_appoarch_road: cat(catalog, 'approach_road'),
        data_water_source: cat(catalog, 'water_source'),
        data_power_source: cat(catalog, 'power_source'),
        data_soil_fertility: cat(catalog, 'soil_fertility'),
        data_irrigation_type: cat(catalog, 'irrigation_type'),
        data_irrigation_source: cat(catalog, 'irrigation_source'),
        data_land_document: cat(catalog, 'land_document'),
        all_farmer: allFarmer,
        farm_lands: farmLands,
      },
      farmerRealId,
    })
  } catch (error: any) {
    console.error('[ekibbo-farmland GET]', error)
    return NextResponse.json({ result: false, message: 'Failed to load farmland data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!ctx.tenantId) {
      return NextResponse.json({ result: false, message: 'No tenant context' }, { status: 400 })
    }
    const tf = buildTenantFilter(ctx, 'tenantId')

    // JSON or multipart (photos as data-URIs, ≤2MB)
    let fields: Record<string, any> = {}
    // Plant inventory rows reassembled from Dio's multipart flattening
    // (plants[0][crop_category], …) — same pattern as farm_plottings.
    const plantRows: Array<{ cropCategory: string; variety: string | null; plantCount: number; notes: string | null }> = []
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('multipart/form-data')) {
      const form = await req.formData()
      const plottings: Record<number, { lat?: number; lng?: number }> = {}
      const plantMap: Record<number, Record<string, string>> = {}
      for (const [k, v] of form.entries()) {
        if (typeof v === 'string') {
          fields[k] = v
          // Dio flattens nested lists in multipart as `farm_plottings[0][lat]`.
          const pm = k.match(/^farm_plottings\[(\d+)\]\[(lat|lng)\]$/)
          if (pm) {
            const idx = Number(pm[1])
            plottings[idx] = plottings[idx] || {}
            const n = Number(v)
            if (!Number.isNaN(n)) plottings[idx][pm[2] as 'lat' | 'lng'] = n
          }
          // Plant inventory rows: `plants[0][crop_category|variety|plant_count|notes]`
          const em = k.match(/^plants\[(\d+)\]\[(crop_category|variety|plant_count|notes)\]$/)
          if (em) {
            const idx = Number(em[1])
            plantMap[idx] = plantMap[idx] || {}
            plantMap[idx][em[2]] = v
          }
        }
        // Second review (G-vi/G-i): farm photo + land document uploads removed
        // (farm polygon via FarmPolygon points is the land record now).
      }
      const flat = Object.keys(plottings)
        .sort((a, b) => Number(a) - Number(b))
        .map(k => plottings[Number(k)])
        .filter(p => p.lat != null && p.lng != null) as Array<{ lat: number; lng: number }>
      if (flat.length) fields.farm_plottings = flat
      for (const k of Object.keys(plantMap).sort((a, b) => Number(a) - Number(b))) {
        const p = plantMap[Number(k)]
        const count = parseInt(String(p.plant_count ?? '0'), 10)
        if (!p.crop_category || Number.isNaN(count)) continue
        plantRows.push({
          cropCategory: p.crop_category,
          variety: p.variety?.trim() || null,
          plantCount: Math.max(0, count),
          notes: p.notes?.trim() || null,
        })
      }
    } else {
      fields = await req.json().catch(() => ({}))
    }
    // JSON body: `plants: [{ cropCategory | crop_category, variety,
    // plantCount | plant_count, notes }]`
    if (Array.isArray(fields.plants)) {
      for (const p of fields.plants as Array<Record<string, any>>) {
        const category = String(p.cropCategory ?? p.crop_category ?? '').trim()
        const count = parseInt(String(p.plantCount ?? p.plant_count ?? '0'), 10)
        if (!category || Number.isNaN(count) || count < 0) continue
        plantRows.push({
          cropCategory: category,
          variety: p.variety != null ? String(p.variety).trim() : null,
          plantCount: count,
          notes: p.notes != null ? String(p.notes).trim() : null,
        })
      }
    }

    // The mobile app posts the upstream FarmLandModel.toMap() shape which
    // uses snake_case (`farmer_id`); the web form uses camelCase. Accept BOTH
    // so farm land save never 400s on the key spelling.
    const farmerNumId = parseInt(String(fields.farmerId ?? fields.farmer_id ?? ''), 10)
    if (Number.isNaN(farmerNumId)) {
      return NextResponse.json({ result: false, message: 'farmerId (numeric) is required' }, { status: 400 })
    }
    const farmer = await resolveFarmerByNumericId(tf, farmerNumId)
    if (!farmer) {
      return NextResponse.json({ result: false, message: 'Farmer not found' }, { status: 404 })
    }
    const name = String(fields.name ?? fields.farm_name ?? '').trim()
    if (!name) {
      return NextResponse.json({ result: false, message: 'Farm/Plot name is required' }, { status: 400 })
    }

    // Polygon points: web form sends `polygonPoints`; the mobile app sends
    // `farm_plottings: [{lat, lng}]` (or a `listLatLng` string). Normalize all.
    if (typeof fields.farm_plottings === 'string') {
      // Dio may JSON-encode the nested list into one form field.
      try { fields.farm_plottings = JSON.parse(fields.farm_plottings) } catch { /* keep string */ }
    }
    let polygonPoints: Array<{ lat: number; lng: number }> = Array.isArray(fields.polygonPoints)
      ? fields.polygonPoints
      : []
    if (polygonPoints.length === 0 && Array.isArray(fields.farm_plottings)) {
      polygonPoints = (fields.farm_plottings as Array<Record<string, unknown>>)
        .map(p => ({ lat: Number(p.lat), lng: Number(p.lng) }))
        .filter(p => !Number.isNaN(p.lat) && !Number.isNaN(p.lng))
    }
    // Final fallback: parse the mobile's `listLatLng` ("[[lat,lng],[lat,lng]]").
    if (polygonPoints.length === 0 && typeof fields.listLatLng === 'string') {
      try {
        const arr = JSON.parse(fields.listLatLng.replace(/,/g, ','))
        if (Array.isArray(arr)) {
          polygonPoints = (arr as Array<[number, number]>)
            .map(p => ({ lat: Number(p[0]), lng: Number(p[1]) }))
            .filter(p => !Number.isNaN(p.lat) && !Number.isNaN(p.lng))
        }
      } catch { /* not JSON — ignore */ }
    }
    const lat = toNum(fields.lat ?? fields.gpsLatitude ?? (polygonPoints[0]?.lat))
    const lng = toNum(fields.lng ?? fields.gpsLongitude ?? (polygonPoints[0]?.lng))

    const created = await db.farmLand.create({
      data: {
        farmerId: farmer.id,
        name,
        sizeHectares: toNum(fields.sizeHectares ?? fields.total_land_holding),
        latitude: lat,
        longitude: lng,
        landOwnership: toJsonOrString(fields.landOwnership),
        // Second review (G): neighbouring features + access map replace
        // land typology / approach road; survey, water, power, gradient,
        // photos, land document all removed.
        neighbouringFeatures: toJsonOrString(fields.neighbouringFeatures ?? fields.neighbouring_features),
        accessMapLat: toNum(fields.accessMapLat ?? fields.access_map?.lat),
        accessMapLng: toNum(fields.accessMapLng ?? fields.access_map?.lng),
        soilFertility: toJsonOrString(fields.soilFertility),
        irrigationType: toJsonOrString(fields.irrigationType),
        irrigationSource: toJsonOrString(fields.irrigationSource),
        fullTimeWorkers: toNum(fields.fullTimeWorkers),
        partTimeWorkers: toNum(fields.partTimeWorkers),
        seasonalWorkers: toNum(fields.seasonalWorkers),
        familyWorkers: toNum(fields.familyWorkers),
        lastChemicalApplicationDate: fields.lastChemicalApplicationDate
          ? new Date(fields.lastChemicalApplicationDate) : null,
        estYieldKg: toNum(fields.estYieldKg ?? fields.est_yield),
        // Organic/conversion info (web-form parity — UAT feedback: these were
        // silently dropped by the mobile endpoint before).
        conventionalLands: toJsonOrString(fields.conventionalLands ?? fields.conventional_lands),
        fallowPastureLand: toJsonOrString(fields.fallowPastureLand ?? fields.fallow_pasture_land),
        conventionalCrops: toJsonOrString(fields.conventionalCrops ?? fields.conventional_crops),
        certType: toJsonOrString(fields.certType ?? fields.cert_type),
        conversionStatus: toJsonOrString(fields.conversionStatus ?? fields.conversion_status),
        conversionDate: fields.conversionDate
          ? new Date(fields.conversionDate) : null,
        inspectorName: toJsonOrString(fields.inspectorName),
        conversionQualified: fields.conversionQualified != null
          ? ['true', '1', true].includes(fields.conversionQualified as any) : null,
        conversionRemarks: toJsonOrString(fields.conversionRemarks ?? fields.conversion_remarks),
        polygonPoints: polygonPoints.length
          ? { create: polygonPoints.map((p, i) => ({ latitude: Number(p.lat), longitude: Number(p.lng), pointOrder: i })) }
          : undefined,
      },
    })

    // Optional plant inventory rows (UAT: "add plant type details" at plot
    // registration). CropMaster link resolved per row, same as the
    // /ekibbo-farm-plants endpoint.
    let plantsCreated = 0
    for (const p of plantRows) {
      if (!p.cropCategory || p.plantCount <= 0) continue
      await db.farmPlant.create({
        data: {
          farmId: created.id,
          cropCategory: p.cropCategory,
          cropMasterId: await resolveCropMasterId(p.cropCategory, p.variety),
          variety: p.variety,
          plantCount: p.plantCount,
          notes: p.notes,
          createdBy: ctx.userId || null,
        },
      })
      plantsCreated++
    }

    return NextResponse.json({
      result: true,
      message: 'Farm land registered',
      data: { farm_id: numericId(created.id), plants_created: plantsCreated },
    })
  } catch (error: any) {
    console.error('[ekibbo-farmland POST]', error)
    return NextResponse.json({ result: false, message: 'Failed to register farm land', detail: error.message }, { status: 500 })
  }
}
