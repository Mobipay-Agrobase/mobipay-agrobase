import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dashboard/ekibbo-loyalty/cycle?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Phase 2 of the EKIBBO Customer Loyalty feature — the "Loyalty Cycle" or
 * "Engagement Depth" indicator. Runs ALONGSIDE the Phase 1 KPI (loyal farmer
 * rate), not as a replacement.
 *
 * The cycle is a 0–4 stage completion score per farmer:
 *   Stage 1: Attended ≥1 training OR received ≥1 farm visit in the period
 *            (both count as "extension support")
 *   Stage 2: Took ≥1 input distribution in the period
 *   Stage 3: Sold ≥1 produce to EKiBBO in the period
 *   Stage 4: Repeat seller — ≥2 sales in the period (proxy for cross-season
 *            repeat behavior; full cross-season detection is Phase 3)
 *
 * A farmer who completed all 4 stages demonstrates the full loyalty cycle:
 *   Training → Input uptake → Sales back to us → Repeat
 *
 * Returns:
 *   {
 *     period: { from, to },
 *     distribution: [{ stages: 0|1|2|3|4, count, pct }],
 *     funnel: { training, input, sale, repeat },
 *     totals: { engagedFarmers, fullCycleFarmers, avgStagesCompleted }
 *   }
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any

    const { searchParams } = new URL(req.url)
    const now = new Date()
    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')
    const from = fromStr ? new Date(fromStr + 'T00:00:00Z') : new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
    let to = toStr ? new Date(toStr + 'T23:59:59Z') : new Date()
    if (to > now) to = now
    if (from > to) {
      return NextResponse.json({ error: 'Invalid date range: from > to' }, { status: 400 })
    }

    const [salesGrouped, inputsGrouped, trainingsGrouped, visitsGrouped] = await Promise.all([
      db.sale.groupBy({
        by: ['farmerId'],
        where: { ...tf, category: 'PRODUCE', status: 'COMPLETED', createdAt: { gte: from, lte: to }, farmerId: { not: null } },
        _count: { _all: true },
      }),
      db.inputDistribution.groupBy({
        by: ['farmerId'],
        where: { ...tf, distributionDate: { gte: from, lte: to } },
        _count: { _all: true },
      }),
      db.trainingAttendance.groupBy({
        by: ['farmerId'],
        where: { training: { ...tf, date: { gte: from, lte: to } }, attended: true },
        _count: { _all: true },
      }),
      db.farmVisit.groupBy({
        by: ['farmerId'],
        where: { farmer: { ...tf }, visitDate: { gte: from, lte: to }, farmerId: { not: null } },
        _count: { _all: true },
      }),
    ])

    // Stage 1: training OR farm visit (extension support)
    const trainingFarmers = new Set<string>()
    for (const r of trainingsGrouped as any[]) trainingFarmers.add(r.farmerId)
    for (const r of visitsGrouped as any[]) if (r.farmerId) trainingFarmers.add(r.farmerId)

    // Stage 2: input distribution
    const inputFarmers = new Set<string>()
    for (const r of inputsGrouped as any[]) inputFarmers.add(r.farmerId)

    // Stage 3: produce sale
    const saleFarmers = new Set<string>()
    const saleCounts = new Map<string, number>()
    for (const r of salesGrouped as any[]) {
      if (!r.farmerId) continue
      saleFarmers.add(r.farmerId)
      saleCounts.set(r.farmerId, r._count._all)
    }

    // Stage 4: repeat seller (≥2 sales)
    const repeatFarmers = new Set<string>()
    for (const [fid, cnt] of saleCounts.entries()) {
      if (cnt >= 2) repeatFarmers.add(fid)
    }

    // Union of all engaged farmers (denominator)
    const allEngaged = new Set<string>([
      ...trainingFarmers,
      ...inputFarmers,
      ...saleFarmers,
    ])

    // Per-farmer stage count (0–4) → distribution buckets
    const distribution = [0, 0, 0, 0, 0]
    for (const fid of allEngaged) {
      let stages = 0
      if (trainingFarmers.has(fid)) stages++
      if (inputFarmers.has(fid)) stages++
      if (saleFarmers.has(fid)) stages++
      if (repeatFarmers.has(fid)) stages++
      distribution[stages]++
    }

    const engagedFarmers = allEngaged.size
    const fullCycleFarmers = distribution[4]
    const totalStages = distribution.reduce((sum, cnt, i) => sum + cnt * i, 0)
    const avgStagesCompleted = engagedFarmers > 0 ? Math.round((totalStages / engagedFarmers) * 10) / 10 : 0

    const distributionWithPct = distribution.map((count, stages) => ({
      stages,
      count,
      pct: engagedFarmers > 0 ? Math.round((count / engagedFarmers) * 1000) / 10 : 0,
    }))

    return NextResponse.json({
      period: {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      },
      distribution: distributionWithPct,
      funnel: {
        training: trainingFarmers.size,
        input: inputFarmers.size,
        sale: saleFarmers.size,
        repeat: repeatFarmers.size,
      },
      totals: {
        engagedFarmers,
        fullCycleFarmers,
        avgStagesCompleted,
      },
    })
  } catch (error) {
    console.error('EKIBBO loyalty cycle error:', error)
    return NextResponse.json({ error: 'Failed to compute loyalty cycle' }, { status: 500 })
  }
}
