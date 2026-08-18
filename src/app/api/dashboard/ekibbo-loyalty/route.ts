import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { Prisma } from '@prisma/client'

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
 */
async function computeMonthlyTrend(
  saleWhere: any,
  inputWhere: any,
  attendanceWhere: any,
  farmVisitWhere: any,
  from: Date,
  to: Date,
) {
  // Use raw SQL for efficiency — one query per month would be N requests.
  // We'll fetch monthly sales + monthly input purchases + monthly attendances
  // + monthly farm visits, all grouped by month, then merge in JS.
  const tenantCondition = saleWhere.tenantId
    ? Prisma.sql`AND s."tenantId" = ${saleWhere.tenantId.in ? Prisma.join(saleWhere.tenantId.in, ',', '(', ')') : saleWhere.tenantId}`
    : Prisma.empty

  // Monthly sales per farmer (PRODUCE only, COMPLETED only)
  const monthlySales = await db.$queryRaw<{ month: string; farmerId: string; cnt: number }[]>(Prisma.sql`
    SELECT to_char(s."createdAt", 'YYYY-MM') AS month,
           s."farmerId" AS "farmerId",
           COUNT(*)::int AS cnt
    FROM "Sale" s
    WHERE s."category" = 'PRODUCE'
      AND s."status" = 'COMPLETED'
      AND s."farmerId" IS NOT NULL
      AND s."createdAt" >= ${from}
      AND s."createdAt" <= ${to}
      ${tenantCondition}
    GROUP BY month, s."farmerId"
  `)

  // Monthly input distributions per farmer
  const monthlyInputs = await db.$queryRaw<{ month: string; farmerId: string }[]>(Prisma.sql`
    SELECT to_char(i."distributionDate", 'YYYY-MM') AS month,
           i."farmerId" AS "farmerId"
    FROM "InputDistribution" i
    WHERE i."distributionDate" >= ${from}
      AND i."distributionDate" <= ${to}
      ${tenantCondition}
    GROUP BY month, i."farmerId"
  `)

  // Monthly training attendances per farmer
  const monthlyTrainings = await db.$queryRaw<{ month: string; farmerId: string }[]>(Prisma.sql`
    SELECT to_char(t."date", 'YYYY-MM') AS month,
           ta."farmerId" AS "farmerId"
    FROM "TrainingAttendance" ta
    JOIN "Training" t ON t.id = ta."trainingId"
    WHERE ta.attended = true
      AND t."date" >= ${from}
      AND t."date" <= ${to}
      ${tenantCondition}
    GROUP BY month, ta."farmerId"
  `)

  // Monthly farm visits per farmer
  const monthlyVisits = await db.$queryRaw<{ month: string; farmerId: string }[]>(Prisma.sql`
    SELECT to_char(fv."visitDate", 'YYYY-MM') AS month,
           fv."farmerId" AS "farmerId"
    FROM "FarmVisit" fv
    JOIN "FarmerProfile" fp ON fp.id = fv."farmerId"
    WHERE fv."visitDate" >= ${from}
      AND fv."visitDate" <= ${to}
      ${tenantCondition}
    GROUP BY month, fv."farmerId"
  `)

  // Build month → { sellers, active } maps
  const months = new Set<string>()
  for (const r of monthlySales) months.add(r.month)
  for (const r of monthlyInputs) months.add(r.month)
  for (const r of monthlyTrainings) months.add(r.month)
  for (const r of monthlyVisits) months.add(r.month)

  const trend: Array<{ month: string; loyal: number; active: number; rate: number | null }> = []
  for (const month of [...months].sort()) {
    const sellers = new Set<string>()
    for (const r of monthlySales) if (r.month === month) sellers.add(r.farmerId)
    const active = new Set<string>(sellers)
    for (const r of monthlyInputs) if (r.month === month) active.add(r.farmerId)
    for (const r of monthlyTrainings) if (r.month === month) active.add(r.farmerId)
    for (const r of monthlyVisits) if (r.month === month) active.add(r.farmerId)
    const loyal = sellers.size
    const activeCount = active.size
    trend.push({
      month,
      loyal,
      active: activeCount,
      rate: activeCount > 0 ? Math.round((loyal / activeCount) * 1000) / 10 : null,
    })
  }

  return trend
}
