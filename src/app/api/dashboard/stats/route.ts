import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { Prisma } from '@prisma/client'

// Helper to safely convert BigInt to number for JSON serialization
function n(v: unknown): number {
  return typeof v === 'bigint' ? Number(v) : (v as number) || 0
}

export async function GET() {
  const ctx = await getTenantContext()
  const tf = buildTenantFilter(ctx, 'tenantId') as any

  // Build safe tenant condition for raw SQL (parameterized)
  const isAll = ctx.isSuperAdmin || ctx.tenantScope.length === 0
  const tenantIds = !isAll && ctx.tenantScope.length > 0 ? ctx.tenantScope : null

  // Use Prisma.sql for parameterized queries — prevents SQL injection
  const monthlyRegistrations = tenantIds
    ? await db.$queryRaw<{ month: string; count: number }[]>(
        Prisma.sql`
          SELECT to_char("createdAt", 'YYYY-MM') as month, COUNT(*)::int as count
          FROM "FarmerProfile"
          WHERE "status" = 'ACTIVE'
            AND "tenantId" = ANY(${tenantIds})
          GROUP BY month ORDER BY month LIMIT 12
        `
      )
    : await db.$queryRaw<{ month: string; count: number }[]>(
        Prisma.sql`
          SELECT to_char("createdAt", 'YYYY-MM') as month, COUNT(*)::int as count
          FROM "FarmerProfile"
          WHERE "status" = 'ACTIVE'
          GROUP BY month ORDER BY month LIMIT 12
        `
      )

  const vslaSavingsByGroup = tenantIds
    ? await db.$queryRaw<{ name: string; total: number }[]>(
        Prisma.sql`
          SELECT vg."name", COALESCE(SUM(vs."amount"), 0)::float as total
          FROM "VslaGroup" vg
          LEFT JOIN "VslaSaving" vs ON vs."vslaGroupId" = vg.id AND vs."status" = 'COMPLETED'
          WHERE vg."isActive" = true
            AND vg."tenantId" = ANY(${tenantIds})
          GROUP BY vg.id, vg."name" ORDER BY total DESC LIMIT 10
        `
      )
    : await db.$queryRaw<{ name: string; total: number }[]>(
        Prisma.sql`
          SELECT vg."name", COALESCE(SUM(vs."amount"), 0)::float as total
          FROM "VslaGroup" vg
          LEFT JOIN "VslaSaving" vs ON vs."vslaGroupId" = vg.id AND vs."status" = 'COMPLETED'
          WHERE vg."isActive" = true
          GROUP BY vg.id, vg."name" ORDER BY total DESC LIMIT 10
        `
      )

  // Build relation-based tenant filter for models WITHOUT tenantId
  // VslaSaving, VslaTransaction: filter through vslaGroup.tenantId
  // Payment: filter through paymentAccount.tenantId (or skip if not available)
  const vslaRelationFilter = ctx.isSuperAdmin ? {} : { vslaGroup: { tenantId: { in: ctx.tenantScope } } }
  const paymentRelationFilter = ctx.isSuperAdmin ? {} : { paymentAccount: { tenantId: { in: ctx.tenantScope } } }

  const [
    farmerCount, vslaCount, totalSavingsResult, activeLoanCount,
    marketListings, trainingCount, maleCount, femaleCount, groupCount,
    recentTransactions,
    loanCount, completedLoans, overdueLoans, pendingLoans
  ] = await Promise.all([
    db.farmerProfile.count({ where: { status: 'ACTIVE', ...tf } }),
    db.vslaGroup.count({ where: { isActive: true, isClosed: false, ...tf } }),
    // VslaSaving has no tenantId — filter through vslaGroup relation
    db.vslaSaving.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', ...vslaRelationFilter } }),
    db.vslaLoan.count({ where: { status: { in: ['APPROVED', 'DISBURSED'] }, ...tf } }),
    db.marketProduct.count({ where: { status: 'AVAILABLE', ...tf } }),
    db.training.count({ where: tf }),
    db.farmerProfile.count({ where: { gender: 'Male', status: 'ACTIVE', ...tf } }),
    db.farmerProfile.count({ where: { gender: 'Female', status: 'ACTIVE', ...tf } }),
    db.farmerGroup.count({ where: { isActive: true, ...tf } }),
    // VslaTransaction has no tenantId — filter through vslaGroup relation
    db.vslaTransaction.findMany({ where: vslaRelationFilter, take: 10, orderBy: { createdAt: 'desc' } }),
    db.vslaLoan.count({ where: tf }),
    db.vslaLoan.count({ where: { status: 'REPAID', ...tf } }),
    db.vslaLoan.count({ where: { status: 'OVERDUE', ...tf } }),
    db.vslaLoan.count({ where: { status: 'PENDING', ...tf } }),
  ])

  // Safely convert all BigInt values
  const safeMonthlyRegs = (monthlyRegistrations || []).map((r: { month: string; count: number }) => ({
    month: r.month,
    count: n(r.count)
  }))

  const safeVslaSavings = (vslaSavingsByGroup || []).map((r: { name: string; total: number }) => ({
    name: r.name,
    total: n(r.total)
  }))

  // Use REAL monthly data — no more simulated/fake data
  const finalMonthlyRegs = safeMonthlyRegs.length > 0
    ? safeMonthlyRegs
    : [{ month: new Date().toISOString().slice(0, 7), count: n(farmerCount) }]

  // Use recent payments as transactions if no VSLA transactions
  // Payment has no tenantId — filter through paymentAccount relation (or fetch all for super admin)
  const recentPayments = recentTransactions.length > 0
    ? recentTransactions
    : await db.payment.findMany({
        where: paymentRelationFilter,
        take: 10,
        orderBy: { createdAt: 'desc' },
        // Include paymentAccount to get tenant info
        include: { paymentAccount: { select: { tenantId: true } } },
      })

  return NextResponse.json({
    stats: {
      farmerCount: n(farmerCount),
      vslaCount: n(vslaCount),
      totalSavings: totalSavingsResult._sum?.amount ? Number(totalSavingsResult._sum.amount) : 0,
      activeLoanCount: n(activeLoanCount),
      marketListings: n(marketListings),
      trainingCount: n(trainingCount),
      maleCount: n(maleCount),
      femaleCount: n(femaleCount),
      groupCount: n(groupCount),
      loanCount: n(loanCount),
      completedLoans: n(completedLoans),
      overdueLoans: n(overdueLoans),
      pendingLoans: n(pendingLoans),
    },
    recentTransactions: recentPayments,
    monthlyRegistrations: finalMonthlyRegs,
    vslaSavingsByGroup: safeVslaSavings
  })
}