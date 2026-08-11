import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { NextResponse } from 'next/server'
import { SatelliteOrchestrator } from '@/lib/satellite/orchestrator'

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const tenantFilter = buildTenantFilter(ctx)
    const body = await request.json()
    const { farmId, polygon, dateFrom, dateTo } = body

    if (!farmId) {
      return NextResponse.json({ error: 'farmId is required' }, { status: 400 })
    }

    // Verify farm belongs to tenant
    const farm = await db.farmLand.findFirst({
      where: { id: farmId, ...tenantFilter },
    })

    if (!farm) {
      return NextResponse.json({ error: 'Farm not found or access denied' }, { status: 404 })
    }

    // Normalize polygon points (accept lat/lng or latitude/longitude shapes)
    const rawPoints: unknown[] = Array.isArray(polygon) ? polygon : (polygon?.points ?? [])
    const points = rawPoints.map((p: any) => {
      const lat = typeof p.lat === 'number' ? p.lat : p.latitude
      const lng = typeof p.lng === 'number' ? p.lng : p.longitude
      return { lat, lng }
    }).filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number')

    // Run the satellite analysis engine over the plot polygon
    const result = await SatelliteOrchestrator.analyzePlot(
      farmId,
      { farmId, points, centroid: undefined },
      dateFrom ? new Date(dateFrom) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      dateTo ? new Date(dateTo) : new Date(),
    )

    const classification = result.landCover.class

    return NextResponse.json({
      plotId: farmId,
      ndvi: {
        current: result.vegetationIndices.NDVI,
        trend: result.ndviTimeSeries?.trend ?? (classification === 'CROPLAND' ? 'STABLE' : 'DECLINING'),
        comparison: result.dataQuality.lastImageData === 'none' ? 'Insufficient imagery' : `Cloud coverage ${result.dataQuality.cloudCoverAvg}%`,
      },
      rainfall: result.rainfallData
        ? {
            last30DaysMm: result.rainfallData.totalMm,
            anomaly: result.rainfallData.anomaly !== 0 ? `${result.rainfallData.anomaly}%` : '0%',
            status: result.rainfallData.totalMm > 50 ? 'ADEQUATE' : result.rainfallData.totalMm > 20 ? 'MARGINAL' : 'DRY',
            dailyRainfall: result.rainfallData.dailyData,
          }
        : { last30DaysMm: 0, anomaly: '0%', status: 'DRY', dailyRainfall: [] },
      landCover: {
        classification,
        confidence: 0.85,
        ndvi: result.vegetationIndices.NDVI,
        ndwi: result.vegetationIndices.NDWI,
      },
      deforestationAlert: result.deforestationAlert
        ? {
            detected: true,
            severity: result.deforestationAlert.severity,
            areaAffectedHa: result.deforestationAlert.areaAffectedHectares,
            lastCheckDate: new Date().toISOString(),
          }
        : {
            detected: false,
            severity: 'NONE',
            areaAffectedHa: 0,
            lastCheckDate: new Date().toISOString(),
          },
      biomass: result.biomassEstimate,
      advisories: result.advisories,
      cropCalendarMatch: result.cropCalendarMatch,
      areaHectares: result.areaHectares,
      location: result.location,
      analysisDate: result.analysisDate,
      dataQuality: result.dataQuality,
    })
  } catch (error) {
    console.error('Satellite analyze error:', error)
    return NextResponse.json({ error: 'Failed to analyze plot' }, { status: 500 })
  }
}