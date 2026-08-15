import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/farm-lands?farmerId=xxx
 *   List farm lands for a farmer (or all farms in tenant scope)
 *
 * POST /api/farm-lands
 *   Create a new farm land with polygon points + all Excel fields.
 *   Body includes: farmerId, name, sizeHectares, latitude, longitude,
 *   polygonPoints (array of {lat, lng}), landOwnership, waterSource, etc.
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
      approachRoad: safeParse(f.approachRoad),
      landGradient: safeParse(f.landGradient),
      irrigationSource: safeParse(f.irrigationSource),
      soilCriteria: safeParse(f.soilCriteria),
    }))

    return NextResponse.json({ farms: farmsParsed, total, page, totalPages: Math.ceil(total / limit) })
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
      landOwnership, waterSource, soilFertility, landSurveyNo,
      approachRoad, landTopology, landGradient, landDocumentUrl, powerSource,
      farmPhotoUrl, irrigationSource, irrigationType,
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
        waterSource,
        soilFertility,
        landSurveyNo,
        approachRoad: toJsonOrString(approachRoad),
        landTopology,
        landGradient: toJsonOrString(landGradient),
        landDocumentUrl,
        powerSource,
        farmPhotoUrl,
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
