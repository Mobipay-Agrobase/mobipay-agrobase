import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/farm-lands?farmerId=xxx&includeKpis=true
 *   List farm lands for a farmer (or all farms in tenant scope).
 *   Second review (H): includeKpis=true adds registry KPI aggregation —
 *   total plots, total acreage, and total plants broken down per crop type.
 *
 * POST /api/farm-lands
 *   Create a new farm land with polygon points.
 *   Body includes: farmerId, name, sizeHectares, latitude, longitude,
 *   polygonPoints (array of {lat, lng}), landOwnership, neighbouringFeatures,
 *   accessMapLat/accessMapLng, etc.
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get('farmerId')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    // Full polygon coordinates are only needed for the map view. The list/table
    // view only needs the point count, which is far cheaper to fetch.
    const includePolygons = searchParams.get('includePolygons') === 'true'
    // Second review (H): KPI aggregation for the Farm Land Registry dashboard
    const includeKpis = searchParams.get('includeKpis') === 'true'

    const where: Record<string, unknown> = {
      farmer: { ...buildTenantFilter(ctx, 'tenantId') },
    }
    if (farmerId) where.farmerId = farmerId
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { farmer: { firstName: { contains: search, mode: 'insensitive' } } },
        { farmer: { lastName: { contains: search, mode: 'insensitive' } } },
        { farmer: { farmerCode: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [farms, total] = await Promise.all([
      db.farmLand.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true } },
          ...(includePolygons
            ? { polygonPoints: { orderBy: { pointOrder: 'asc' } } }
            : {}),
          _count: { select: { cultivations: true, polygonPoints: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.farmLand.count({ where }),
    ])

    // Parse JSON fields — safely handle both JSON arrays and plain strings
    const safeParse = (v: string | null): any => {
      if (!v) return []
      try { return JSON.parse(v) } catch { return v }
    }
    const farmsParsed = farms.map(f => ({
      ...f,
      neighbouringFeatures: safeParse(f.neighbouringFeatures),
      irrigationSource: safeParse(f.irrigationSource),
      soilCriteria: safeParse(f.soilCriteria),
    }))

    // ─── Second review (H): Farm Land Registry KPI aggregation ────────
    // Total land plots / total acreage / total plants (CropProduction
    // treeCount grouped by crop type, with variety breakdown + shade
    // trees from shadeTreeVarieties). Computed across the FULL tenant
    // scope (not just the current page).
    let kpis: unknown = null
    if (includeKpis) {
      const [plotCount, acreageAgg, cropProductions, shadeVarieties] = await Promise.all([
        db.farmLand.count({ where }),
        db.farmLand.aggregate({ where, _sum: { sizeHectares: true } }),
        db.cropProduction.groupBy({
          by: ['cropName', 'variety'],
          where: { farmer: { ...buildTenantFilter(ctx, 'tenantId') } },
          _sum: { treeCount: true },
        }),
        db.farmerProfile.findMany({
          where: { ...buildTenantFilter(ctx, 'tenantId'), shadeTreeVarieties: { not: null } },
          select: { shadeTreeVarieties: true },
        }),
      ])

      // Aggregate plants per crop type; variety detail kept for the
      // "View more details" breakdown (Coffee/Robusta, Cocoa/Trinitario…,
      // Shade Trees, Bananas, Jackfruit, Avocado, Cassava, …).
      const byCrop = new Map<string, number>()
      const byVariety = new Map<string, number>()
      for (const row of cropProductions) {
        const crop = (row.cropName || '').trim()
        const count = row._sum.treeCount || 0
        byCrop.set(crop, (byCrop.get(crop) || 0) + count)
        if (row.variety) {
          const key = `${crop} — ${row.variety.trim()}`
          byVariety.set(key, (byVariety.get(key) || 0) + count)
        }
      }
      // Shade tree varieties stored on the farmer profile (JSON:
      // [{variety, count}]) roll up under "Shade Trees".
      for (const fp of shadeVarieties) {
        try {
          const arr = JSON.parse(fp.shadeTreeVarieties || '[]')
          for (const v of arr) {
            if (!v?.variety) continue
            const n = parseInt(String(v.count)) || 0
            byCrop.set('Shade Trees', (byCrop.get('Shade Trees') || 0) + n)
            const key = `Shade Trees — ${String(v.variety).trim()}`
            byVariety.set(key, (byVariety.get(key) || 0) + n)
          }
        } catch { /* ignore malformed JSON */ }
      }

      const plants = Array.from(byCrop.entries())
        .map(([crop, count]) => ({ crop, count }))
        .sort((a, b) => b.count - a.count)
      const plantsByVariety = Array.from(byVariety.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)

      kpis = {
        totalPlots: plotCount,
        totalAcreageHa: Number((acreageAgg._sum.sizeHectares || 0).toFixed(2)),
        totalPlants: plants.reduce((s, p) => s + p.count, 0),
        plants,
        plantsByVariety,
      }
    }

    return NextResponse.json({ farms: farmsParsed, total, page, totalPages: Math.ceil(total / limit), ...(kpis ? { kpis } : {}) })
  } catch (error) {
    console.error('Farm land list error:', error)
    return NextResponse.json({ error: 'Failed to fetch farm lands' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()
    const {
      farmerId, name, sizeHectares, latitude, longitude,
      polygonPoints, // array of { lat, lng, altitude? }
      landOwnership, soilFertility,
      // Second review (G): new farm land fields
      neighbouringFeatures, accessMapLat, accessMapLng,
      irrigationSource, irrigationType,
      fullTimeWorkers, partTimeWorkers, seasonalWorkers, familyWorkers,
      lastChemicalApplicationDate, conventionalLands, fallowPastureLand,
      conventionalCrops, estYieldKg, certType, conversionStatus,
      conversionDate, inspectorName, conversionQualified, conversionRemarks,
      soilCollectionDate, soilLabTestingDate, soilResultDate, soilReportUrl,
      soilSamplesInfo, soilCriteria,
    } = body as Record<string, any>

    if (!farmerId || !name) {
      return NextResponse.json({ error: 'farmerId and name are required' }, { status: 400 })
    }

    // Verify farmer belongs to tenant
    const farmer = await db.farmerProfile.findFirst({
      where: { id: farmerId, ...buildTenantFilter(ctx, 'tenantId') },
      select: { id: true },
    })
    if (!farmer) {
      return NextResponse.json({ error: 'Farmer not found or access denied' }, { status: 404 })
    }

    // Helper: accept either a string or an array. Arrays are JSON.stringified;
    // strings are stored as-is so the catalog-driven single-select dropdowns work.
    const toJsonOrString = (v: any): string | null => {
      if (v == null || v === '') return null
      if (Array.isArray(v)) return JSON.stringify(v)
      return String(v)
    }

    // Create the farm land
    const farm = await db.farmLand.create({
      data: {
        farmerId,
        name,
        sizeHectares: sizeHectares ? parseFloat(sizeHectares) : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        landOwnership,
        soilFertility,
        neighbouringFeatures: toJsonOrString(neighbouringFeatures),
        accessMapLat: accessMapLat ? parseFloat(accessMapLat) : null,
        accessMapLng: accessMapLng ? parseFloat(accessMapLng) : null,
        irrigationSource: toJsonOrString(irrigationSource),
        irrigationType,
        fullTimeWorkers: fullTimeWorkers ? parseInt(fullTimeWorkers) : null,
        partTimeWorkers: partTimeWorkers ? parseInt(partTimeWorkers) : null,
        seasonalWorkers: seasonalWorkers ? parseInt(seasonalWorkers) : null,
        familyWorkers: familyWorkers ? parseInt(familyWorkers) : null,
        lastChemicalApplicationDate: lastChemicalApplicationDate ? new Date(lastChemicalApplicationDate) : null,
        conventionalLands,
        fallowPastureLand,
        conventionalCrops,
        estYieldKg: estYieldKg ? parseFloat(estYieldKg) : null,
        certType,
        conversionStatus,
        conversionDate: conversionDate ? new Date(conversionDate) : null,
        inspectorName,
        conversionQualified: conversionQualified || false,
        conversionRemarks,
        soilCollectionDate: soilCollectionDate ? new Date(soilCollectionDate) : null,
        soilLabTestingDate: soilLabTestingDate ? new Date(soilLabTestingDate) : null,
        soilResultDate: soilResultDate ? new Date(soilResultDate) : null,
        soilReportUrl,
        soilSamplesInfo,
        soilCriteria: toJsonOrString(soilCriteria),
      },
    })

    // Save polygon points if provided
    if (Array.isArray(polygonPoints) && polygonPoints.length >= 3) {
      await db.farmPolygon.createMany({
        data: polygonPoints.map((p: any, i: number) => ({
          farmId: farm.id,
          latitude: p.lat,
          longitude: p.lng,
          altitude: p.altitude || null,
          pointOrder: i,
        })),
      })
    }

    // Fetch the created farm with polygon points
    const farmWithPolygon = await db.farmLand.findUnique({
      where: { id: farm.id },
      include: {
        polygonPoints: { orderBy: { pointOrder: 'asc' } },
        farmer: { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({ farm: farmWithPolygon }, { status: 201 })
  } catch (error) {
    console.error('Farm land create error:', error)
    return NextResponse.json(
      { error: 'Failed to create farm land', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
