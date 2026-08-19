import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { isEkibboTenant } from '@/lib/ekibbo'

/**
 * GET /api/dashboard/ekibbo-loyalty?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Phase 1 of the EKIBBO Customer Loyalty feature.
 *
 * Definition (per Issac + Sophie, EKIBBO):
 *   - A farmer is "loyal" if they have ≥1 sale to EKiBBO in the period.
 *   - Denominator = farmers with ≥1 engagement in the period
 *     (sale OR input purchase OR training attended OR farm visit).
 *   - Repeat sellers = farmers with ≥2 sales in the period.
 *
 * Returns:
 *   {
 *     period: { from, to },
 *     kpi: {
 *       loyalFarmerCount,        // numerator
 *       activeFarmerCount,       // denominator
 *       loyalFarmerRate,         // percentage, null if denominator=0
 *       repeatSellerCount,       // ≥2 sales
 *       repeatSellerRate,        // percentage of loyal farmers who are repeat
 *     },
 *     engagement: {
 *       totalSalesCount,         // total sale transactions in period
 *       avgSalesPerFarmer,       // totalSalesCount / loyalFarmerCount
 *       cropsSoldCount,          // distinct products sold
 *       multiCropFarmerCount,    // farmers who sold ≥2 distinct crops
 *       inputPurchaseFarmerCount,// farmers with ≥1 input distribution
 *       trainingFarmerCount,     // farmers who attended ≥1 training
 *       farmVisitFarmerCount,    // farmers with ≥1 farm visit
 *     },
 *     trend: [                   // monthly trend for the period
 *       { month: 'YYYY-MM', loyal, active, rate }
 *     ]
 *   }
 *
 * Filters:
 *   - from: YYYY-MM-DD (default: Jan 1 of current year)
 *   - to:   YYYY-MM-DD (default: today)
 *
 * Auth: any authenticated user with dashboard:read.
 * Tenant-scoped via buildTenantFilter — only counts farmers/data in the
 * caller's tenant (SUPER_ADMIN sees all tenants).
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any

    // ─── EKIBBO-ONLY feature gate ────────────────────────────────────────
    // Loyalty is exclusive to the EKIBBO tenant (type=EXPORTER). Return 404
    // for any other tenant so the feature is completely invisible.
    // SUPER_ADMIN bypasses (can view loyalty for any tenant when analyzing).
    if (!(await isEkibboTenant(ctx))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const now = new Date()
    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')

    // Default period: year-to-date
    const from = fromStr ? new Date(fromStr + 'T00:00:00Z') : new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
    let to = toStr ? new Date(toStr + 'T23:59:59Z') : new Date()
    // Clamp 'to' to not exceed now
    if (to > now) to = now
    // Clamp 'from' to not be after 'to'
    if (from > to) {
      return NextResponse.json({ error: 'Invalid date range: from > to' }, { status: 400 })
    }

    // Build tenant filters for each model. Sales + Trainings have tenantId;
    // FarmVisit + TrainingAttendance don't, so we filter through the related
    // farmer's tenantId.
    const saleWhere = {
      ...tf,
      category: 'PRODUCE', // EKiBBO loyalty = sold PRODUCE to us (not inputs)
      status: 'COMPLETED',
      createdAt: { gte: from, lte: to },
    }
    const inputWhere = {
      ...tf,
      distributionDate: { gte: from, lte: to },
    }
    const trainingWhere = {
      ...tf,
      date: { gte: from, lte: to },
      status: 'COMPLETED',
    }
    const farmVisitWhere = {
      farmer: { ...tf },
      visitDate: { gte: from, lte: to },
    }
    const attendanceWhere = {
      training: { ...tf, date: { gte: from, lte: to } },
      attended: true,
    }

    // Run all aggregations in parallel
    const [
      salesGrouped,
      inputsGrouped,
      trainingsAttendedGrouped,
      farmVisitsGrouped,
      totalSalesCount,
      distinctCropsResult,
      multiCropFarmersResult,
    ] = await Promise.all([
      // Group sales by farmerId — returns [{ farmerId, _count }]
      db.sale.groupBy({
        by: ['farmerId'],
        where: { ...saleWhere, farmerId: { not: null } },
        _count: { _all: true },
      }),
      // Group input distributions by farmerId
      db.inputDistribution.groupBy({
        by: ['farmerId'],
        where: inputWhere,
        _count: { _all: true },
      }),
      // Group training attendances by farmerId (attended=true)
      db.trainingAttendance.groupBy({
        by: ['farmerId'],
        where: attendanceWhere,
        _count: { _all: true },
      }),
      // Group farm visits by farmerId
      db.farmVisit.groupBy({
        by: ['farmerId'],
        where: { ...farmVisitWhere, farmerId: { not: null } },
        _count: { _all: true },
      }),
      // Total sale transaction count
      db.sale.count({ where: saleWhere }),
      // Distinct crops (products) sold
      db.sale.findMany({
        where: saleWhere,
        select: { product: true },
        distinct: ['product'],
      }),
      // Multi-crop farmers: farmers who sold ≥2 distinct products
      db.sale.findMany({
        where: saleWhere,
        select: { farmerId: true, product: true },
        distinct: ['farmerId', 'product'],
      }),
    ])

    // Build sets of farmerIds per engagement type
    const sellers = new Set<string>()
    const sellerSaleCounts = new Map<string, number>()
    for (const row of salesGrouped as any[]) {
      const fid = row.farmerId
      if (!fid) continue
      sellers.add(fid)
      sellerSaleCounts.set(fid, row._count._all)
    }
    const inputBuyers = new Set<string>()
    for (const row of inputsGrouped as any[]) inputBuyers.add(row.farmerId)
    const trainingAttendees = new Set<string>()
    for (const row of trainingsAttendedGrouped as any[]) trainingAttendees.add(row.farmerId)
    const farmVisitFarmers = new Set<string>()
    for (const row of farmVisitsGrouped as any[]) {
      if (row.farmerId) farmVisitFarmers.add(row.farmerId)
    }

    // Active farmers = union of all engagement types
    const activeFarmers = new Set<string>([
      ...sellers,
      ...inputBuyers,
      ...trainingAttendees,
      ...farmVisitFarmers,
    ])

    // Repeat sellers = sellers with ≥2 sales
    let repeatSellerCount = 0
    for (const count of sellerSaleCounts.values()) {
      if (count >= 2) repeatSellerCount++
    }

    // Multi-crop farmers: count farmers with ≥2 distinct products
    const farmerCrops = new Map<string, Set<string>>()
    for (const row of multiCropFarmersResult as any[]) {
      const fid = row.farmerId
      if (!fid) continue
      if (!farmerCrops.has(fid)) farmerCrops.set(fid, new Set())
      farmerCrops.get(fid)!.add(row.product)
    }
    let multiCropFarmerCount = 0
    for (const crops of farmerCrops.values()) {
      if (crops.size >= 2) multiCropFarmerCount++
    }

    const loyalFarmerCount = sellers.size
    const activeFarmerCount = activeFarmers.size
    const loyalFarmerRate = activeFarmerCount > 0 ? Math.round((loyalFarmerCount / activeFarmerCount) * 1000) / 10 : null
    const repeatSellerRate = loyalFarmerCount > 0 ? Math.round((repeatSellerCount / loyalFarmerCount) * 1000) / 10 : null
    const avgSalesPerFarmer = loyalFarmerCount > 0 ? Math.round((totalSalesCount / loyalFarmerCount) * 10) / 10 : 0

    // Monthly trend over the period
    const trend = await computeMonthlyTrend(saleWhere, inputWhere, attendanceWhere, farmVisitWhere, from, to)

    return NextResponse.json({
      period: {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      },
      kpi: {
        loyalFarmerCount,
        activeFarmerCount,
        loyalFarmerRate, // null when denominator=0
        repeatSellerCount,
        repeatSellerRate, // percentage of loyal farmers who are repeat
      },
      engagement: {
        totalSalesCount,
        avgSalesPerFarmer,
        cropsSoldCount: distinctCropsResult.length,
        multiCropFarmerCount,
        inputPurchaseFarmerCount: inputBuyers.size,
        trainingFarmerCount: trainingAttendees.size,
        farmVisitFarmerCount: farmVisitFarmers.size,
      },
      trend,
    })
  } catch (error) {
    console.error('EKIBBO loyalty endpoint error:', error)
    return NextResponse.json({ error: 'Failed to compute loyalty metrics' }, { status: 500 })
  }
}

/**
 * Compute monthly loyalty trend over the period.
 * Returns [{ month: 'YYYY-MM', loyal, active, rate }] for each month
 * from `from` to `to`.
 *
 * Uses Prisma's findMany (not raw SQL) so tenant filtering is handled
 * automatically by the where clause — no manual SQL tenant condition
 * needed. Slightly less efficient than a single raw GROUP BY query,
 * but much safer and easier to maintain.
 */
async function computeMonthlyTrend(
  saleWhere: any,
  inputWhere: any,
  attendanceWhere: any,
  farmVisitWhere: any,
  from: Date,
  to: Date,
) {
  // Fetch all engagements in the period with their timestamps, then
  // bucket by month in JS.
  const [sales, inputs, attendances, visits] = await Promise.all([
    db.sale.findMany({
      where: { ...saleWhere, farmerId: { not: null } },
      select: { farmerId: true, createdAt: true },
    }),
    db.inputDistribution.findMany({
      where: inputWhere,
      select: { farmerId: true, distributionDate: true },
    }),
    db.trainingAttendance.findMany({
      where: attendanceWhere,
      select: { farmerId: true, training: { select: { date: true } } },
    }),
    db.farmVisit.findMany({
      where: { ...farmVisitWhere, farmerId: { not: null } },
      select: { farmerId: true, visitDate: true },
    }),
  ])

  const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`

  // Build month → { sellers: Set<farmerId>, active: Set<farmerId> }
  const monthsMap = new Map<string, { sellers: Set<string>; active: Set<string> }>()
  const ensure = (month: string) => {
    if (!monthsMap.has(month)) monthsMap.set(month, { sellers: new Set(), active: new Set() })
    return monthsMap.get(month)!
  }

  for (const s of sales) {
    if (!s.farmerId) continue
    const m = monthKey(s.createdAt)
    const e = ensure(m)
    e.sellers.add(s.farmerId)
    e.active.add(s.farmerId)
  }
  for (const i of inputs) {
    const m = monthKey(i.distributionDate)
    ensure(m).active.add(i.farmerId)
  }
  for (const a of attendances) {
    const m = monthKey(a.training.date)
    ensure(m).active.add(a.farmerId)
  }
  for (const v of visits) {
    if (!v.farmerId) continue
    const m = monthKey(v.visitDate)
    ensure(m).active.add(v.farmerId)
  }

  const trend: Array<{ month: string; loyal: number; active: number; rate: number | null }> = []
  for (const [month, e] of [...monthsMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const loyal = e.sellers.size
    const active = e.active.size
    trend.push({
      month,
      loyal,
      active,
      rate: active > 0 ? Math.round((loyal / active) * 1000) / 10 : null,
    })
  }
  return trend
}
