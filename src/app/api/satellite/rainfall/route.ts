import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { NextResponse } from 'next/server'
import { SatelliteOrchestrator } from '@/lib/satellite/orchestrator'

export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const tenantFilter = buildTenantFilter(ctx)
    const { searchParams } = new URL(request.url)

    const farmId = searchParams.get('farmId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

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

    const whereClause: Record<string, unknown> = {
      farmId,
      ...tenantFilter,
    }

    if (dateFrom) whereClause.date = { ...((whereClause.date as Record<string, unknown>) || {}), gte: dateFrom }
    if (dateTo) whereClause.date = { ...((whereClause.date as Record<string, unknown>) || {}), lte: dateTo }

    // Try to fetch from DB
    const dbRecords = await db.rainfallRecord.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
    })

    if (dbRecords.length > 0) {
      const dailyData = dbRecords.map((r) => ({
        date: r.date,
        rainfallMm: r.rainfallMm,
        isChirps: r.isChirps,
      }))

      const totalMm = dailyData.reduce((sum, d) => sum + d.rainfallMm, 0)
      const drySpellDays = countDrySpells(dailyData, 7, 1)
      const heavyRainfallDays = dailyData.filter((d) => d.rainfallMm > 50).length

      return NextResponse.json({
        location: {
          latitude: dbRecords[0].latitude,
          longitude: dbRecords[0].longitude,
        },
        totalMm: Math.round(totalMm * 100) / 100,
        dailyData,
        anomaly: null, // Requires historical baseline
        drySpellDays,
        heavyRainfallDays,
      })
    }

    // Fall back to the satellite analysis engine
    const period = {
      dateFrom: dateFrom ? new Date(dateFrom) : new Date(),
      dateTo: dateTo ? new Date(dateTo) : new Date(),
    }
    if (!dateTo) period.dateFrom.setMonth(period.dateTo.getMonth() - 1)

    const rainfallData = await SatelliteOrchestrator.getRainfallReport(farmId, period)

    const dailyData = rainfallData.dailyData.map((d) => ({
      date: d.date,
      rainfallMm: d.rainfallMm,
      isChirps: true,
    }))

    return NextResponse.json({
      location: {
        latitude: rainfallData.location.lat,
        longitude: rainfallData.location.lng,
      },
      totalMm: Math.round(rainfallData.totalMm * 100) / 100,
      dailyData,
      anomaly: rainfallData.anomaly,
      drySpellDays: rainfallData.drySpellDays,
      heavyRainfallDays: rainfallData.heavyRainfallDays,
    })
  } catch (error) {
    console.error('Rainfall data error:', error)
    return NextResponse.json({ error: 'Failed to fetch rainfall data' }, { status: 500 })
  }
}

function countDrySpells(dailyData: { rainfallMm: number }[], consecutiveDays: number, threshold: number): number {
  let count = 0
  let streak = 0
  for (const d of dailyData) {
    if (d.rainfallMm <= threshold) {
      streak++
    } else {
      if (streak >= consecutiveDays) count++
      streak = 0
    }
  }
  if (streak >= consecutiveDays) count++
  return count
}