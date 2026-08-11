import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { NextResponse } from 'next/server'
import { SatelliteOrchestrator } from '@/lib/satellite/orchestrator'
import type { NDVITimeSeries } from '@/lib/satellite/types'

export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const tenantFilter = buildTenantFilter(ctx)
    const { searchParams } = new URL(request.url)

    const farmId = searchParams.get('farmId')
    const months = parseInt(searchParams.get('months') || '12')

    if (!farmId) {
      return NextResponse.json({ error: 'farmId is required' }, { status: 400 })
    }

    // Verify farm access
    const farm = await db.farmLand.findFirst({
      where: { id: farmId, ...tenantFilter },
    })
    if (!farm) {
      return NextResponse.json({ error: 'Farm not found or access denied' }, { status: 404 })
    }

    // Try to fetch from DB first
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - months)

    const dbRecords = await db.ndvTimeSeries.findMany({
      where: {
        farmId,
        ...tenantFilter,
        date: { gte: cutoffDate.toISOString().split('T')[0] },
      },
      orderBy: { date: 'asc' },
    })

    // If we have DB data, return it
    if (dbRecords.length > 0) {
      const points = dbRecords.map((r) => ({
        date: r.date,
        ndvi: r.ndviValue,
        evi: r.eviValue,
      }))

      const ndviValues = points.map((p) => p.ndvi)
      const trend = ndviValues.length >= 6
        ? (ndviValues.slice(-3).reduce((a, b) => a + b, 0) / 3 > ndviValues.slice(0, 3).reduce((a, b) => a + b, 0) / 3 ? 'IMPROVING' : 'DECLINING')
        : 'INSUFFICIENT_DATA'

      return NextResponse.json({
        farmId,
        points,
        trend,
        average: ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length,
        min: Math.min(...ndviValues),
        max: Math.max(...ndviValues),
      })
    }

    // Fall back to the satellite analysis engine
    const timeSeries: NDVITimeSeries = await SatelliteOrchestrator.getPlotTimeSeries(farmId, months)

    if (timeSeries.points.length > 0) {
      const ndviValues = timeSeries.points.map((p) => p.value)
      return NextResponse.json({
        farmId,
        points: timeSeries.points.map((p) => ({
          date: p.date,
          ndvi: Math.round(p.value * 1000) / 1000,
          evi: -1, // EVI not available from engine time series
        })),
        trend: timeSeries.trend,
        average: Math.round((ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length) * 1000) / 1000,
        min: Math.round(Math.min(...ndviValues) * 1000) / 1000,
        max: Math.round(Math.max(...ndviValues) * 1000) / 1000,
      })
    }

    return NextResponse.json({
      farmId,
      points: [],
      trend: 'INSUFFICIENT_DATA',
      average: 0,
      min: 0,
      max: 0,
    })
  } catch (error) {
    console.error('NDVI timeseries error:', error)
    return NextResponse.json({ error: 'Failed to fetch NDVI data' }, { status: 500 })
  }
}