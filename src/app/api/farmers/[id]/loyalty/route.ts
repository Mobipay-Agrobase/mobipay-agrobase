import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/farmers/[id]/loyalty?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Per-farmer loyalty score for the Farmer Detail hero card.
 *
 * Returns the farmer's 0–4 stage completion + counts:
 *   {
 *     stages: 0|1|2|3|4,           // how many of the 4 stages completed
 *     stageFlags: { training, input, sale, repeat },  // booleans per stage
 *     counts: {
 *       salesCount,        // total PRODUCE sales in period
 *       cropsSold,         // distinct products sold
 *       inputPurchases,   // input distributions in period
 *       trainingsAttended, // trainings attended in period
 *       farmVisits,        // farm visits in period
 *     },
 *     totalSalesValueUGX,  // sum of totalAmount for PRODUCE sales
 *     period: { from, to },
 *     isLoyal: boolean,    // true if saleCount >= 1 (Phase 1 definition)
 *     label: 'New' | 'Engaged' | 'Active' | 'Loyal' | 'Champion',  // human-readable tier
 *     color: string,       // tailwind class for the tier badge
 *   }
 *
 * Tier mapping (based on stages):
 *   0 stages → "New" (gray) — has registered but no engagement in period
 *   1 stage  → "Engaged" (blue) — did training/visit OR took inputs OR sold
 *   2 stages → "Active" (amber) — did 2 of the 4 activities
 *   3 stages → "Loyal" (emerald) — did 3 of the 4 activities
 *   4 stages → "Champion" (rose) — completed the full cycle
 *
 * Default period = year-to-date (matches the dashboard default).
 *
 * Auth: any authenticated user with farmers:read.
 * Tenant-scoped — caller must own the farmer.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any

    // Verify the farmer exists + belongs to the caller's tenant
    const farmer = await db.farmerProfile.findFirst({ where: { id, ...tf } })
    if (!farmer) {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 })
    }

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

    const farmerFilter = { farmerId: id }

    // Run all queries in parallel
    const [sales, inputs, trainings, visits] = await Promise.all([
      db.sale.findMany({
        where: { ...tf, ...farmerFilter, category: 'PRODUCE', status: 'COMPLETED', createdAt: { gte: from, lte: to } },
        select: { product: true, totalAmount: true },
      }),
      db.inputDistribution.findMany({
        where: { ...tf, ...farmerFilter, distributionDate: { gte: from, lte: to } },
        select: { id: true },
      }),
      db.trainingAttendance.findMany({
        where: { ...farmerFilter, training: { ...tf, date: { gte: from, lte: to } }, attended: true },
        select: { id: true },
      }),
      db.farmVisit.findMany({
        where: { ...farmerFilter, visitDate: { gte: from, lte: to } },
        select: { id: true },
      }),
    ])

    // Stage flags
    const salesCount = sales.length
    const stageSale = salesCount >= 1
    const stageRepeat = salesCount >= 2
    const stageInput = inputs.length >= 1
    const stageTraining = trainings.length >= 1 || visits.length >= 1 // training OR farm visit

    const stages = [stageTraining, stageInput, stageSale, stageRepeat].filter(Boolean).length

    // Distinct crops sold
    const cropsSet = new Set<string>()
    let totalSalesValue = 0
    for (const s of sales) {
      if (s.product) cropsSet.add(s.product)
      totalSalesValue += s.totalAmount || 0
    }

    // Tier mapping
    let label: string, color: string
    if (stages === 0) { label = 'New'; color = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
    else if (stages === 1) { label = 'Engaged'; color = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' }
    else if (stages === 2) { label = 'Active'; color = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' }
    else if (stages === 3) { label = 'Loyal'; color = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' }
    else { label = 'Champion'; color = 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' }

    return NextResponse.json({
      stages,
      stageFlags: {
        training: stageTraining,
        input: stageInput,
        sale: stageSale,
        repeat: stageRepeat,
      },
      counts: {
        salesCount,
        cropsSold: cropsSet.size,
        inputPurchases: inputs.length,
        trainingsAttended: trainings.length,
        farmVisits: visits.length,
      },
      totalSalesValueUGX: Math.round(totalSalesValue),
      period: {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      },
      isLoyal: stageSale, // Phase 1 definition: sold produce to EKiBBO
      label,
      color,
    })
  } catch (error) {
    console.error('Farmer loyalty error:', error)
    return NextResponse.json({ error: 'Failed to compute farmer loyalty' }, { status: 500 })
  }
}
