import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET() {
  try {
    const ctx = await getTenantContext()
    const tenantWhere = buildTenantFilter(ctx, 'tenantId')

    const [farmerCount, vslaCount, totalSavings, activeLoans, marketListings, trainingCount, payments, monthlyFarmerData, vslaSavingsData, recentTransactions] = await Promise.all([
      db.farmerProfile.count({ where: { ...tenantWhere, status: 'ACTIVE' } }),
      db.vslaGroup.count({ where: { ...tenantWhere, isActive: true } }),
      db.vslaSaving.aggregate({
        where: {
          vslaGroup: { tenantId: ctx.isSuperAdmin ? undefined : { in: ctx.tenantScope as string[] } },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      db.vslaLoan.count({
        where: {
          vslaGroup: { tenantId: ctx.isSuperAdmin ? undefined : { in: ctx.tenantScope as string[] } },
          status: { in: ['DISBURSED', 'PENDING'] },
        },
      }),
      db.marketProduct.count({ where: { status: 'AVAILABLE' } }),
      db.training.count(),
      // Payments filtered through paymentAccount
      db.payment.count({
        where: {
          paymentAccount: ctx.isSuperAdmin ? undefined : { tenantId: { in: ctx.tenantScope as string[] } },
          status: 'COMPLETED',
        },
      }),
      // Monthly farmer registrations — REAL data from database
      db.farmerProfile.groupBy({
        by: ['enrollmentDate'],
        where: tenantWhere,
        _count: true,
      }).then(groups => {
        // Group by month
        const monthly: Record<string, number> = {}
        for (const g of groups) {
          const d = new Date(g.enrollmentDate)
          const key = d.toLocaleDateString('en', { month: 'short' })
          monthly[key] = (monthly[key] || 0) + g._count
        }
        return Object.entries(monthly).map(([month, count]) => ({ month, count }))
      }).catch(() => []),
      // VSLA savings by group
      db.vslaGroup.findMany({
        where: { ...tenantWhere, isActive: true },
        include: { _count: { select: { savings: true, members: true, loans: true } }, savings: { select: { amount: true } } }
      }),
      // Recent transactions
      db.payment.findMany({
        where: {
          paymentAccount: ctx.isSuperAdmin ? undefined : { tenantId: { in: ctx.tenantScope as string[] } },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const vslaSavingsByGroup = vslaSavingsData.map(g => ({
      name: g.name.replace(' VSLA', ''),
      savings: g.savings.reduce((sum: number, s: { amount: number }) => sum + s.amount, 0),
      members: g._count.members,
      loans: g._count.loans,
    }))

    return NextResponse.json({
      farmerCount,
      vslaCount,
      totalSavings: totalSavings._sum.amount || 0,
      activeLoans,
      marketListings,
      trainingCount,
      totalPayments: payments,
      monthlyFarmerData,
      vslaSavingsByGroup,
      recentTransactions,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}