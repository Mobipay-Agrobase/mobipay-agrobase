import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { mobileSyncEngine } from '@/lib/mobile/sync'

/**
 * GET /api/dashboard
 *
 * Role-aware dashboard data:
 *   - FARMER / EKB_FARMER: returns the farmer's OWN data (sales, loans,
 *     ledger, trainings) — powers the farmer self-service dashboard
 *   - EXTENSION_OFFICER / EKB_EXTENSION / field-officer roles: returns
 *     tenant-wide stats + the farmers they've recently visited
 *   - TENANT_ADMIN / SACCO_ADMIN / VSLA_PROVIDER_ADMIN / SUPER_ADMIN:
 *     returns tenant-wide KPIs (existing behaviour)
 *
 * The mobile app renders different widgets based on the role field in
 * the response.
 */
export async function GET() {
  try {
    const ctx = await getTenantContext()

    // ─── FARMER self-service dashboard ──────────────────────────────────
    // Returns the farmer's own data — products sold, loans, ledger, trainings.
    if (['FARMER', 'EKB_FARMER'].includes(ctx.role) && ctx.userId) {
      return await farmerDashboard(ctx)
    }

    // ─── Admin / officer dashboard (existing tenant-wide stats) ─────────
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

    // ─── Loyalty KPIs (year-to-date) ───────────────────────────────────────
    // Added for the mobile dashboard — reuses the same computation as
    // /api/mobile/dashboard (MobileSyncEngine.computeLoyaltyKpis) so the
    // numbers stay consistent across web + mobile.
    // Only compute for tenant-scoped users (not SUPER_ADMIN who sees all tenants).
    let loyaltyStats: any = null
    if (ctx.tenantId) {
      try {
        loyaltyStats = await mobileSyncEngine.computeLoyaltyKpis(ctx.tenantId)
      } catch (e) {
        console.error('Dashboard loyalty KPI error:', e)
      }
    }

    return NextResponse.json({
      role: ctx.role,
      dashboardType: 'admin',
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
      loyalty: loyaltyStats,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}

// ─── Farmer self-service dashboard ────────────────────────────────────────
// Returns the farmer's OWN data — products sold, loans, ledger, trainings.
// Powers the mobile app's farmer-facing dashboard.
async function farmerDashboard(ctx: any) {
  const farmer = await db.farmerProfile.findFirst({
    where: { userId: ctx.userId, tenantId: ctx.tenantId },
    select: {
      id: true, farmerCode: true, firstName: true, lastName: true, phone: true,
      gender: true, photoUrl: true, isCertified: true, certificationType: true,
      farmSize: true, groupId: true, group: { select: { id: true, name: true } },
      villageName: true, district: true, country: true,
    },
  })
  if (!farmer) {
    return NextResponse.json({
      role: ctx.role,
      dashboardType: 'farmer',
      error: 'No farmer profile linked to this account',
    }, { status: 200 })  // 200 so the mobile app can render a "no profile" state
  }

  const farmerId = farmer.id

  const [sales, loans, trainings, ledger, inputDistributions] = await Promise.all([
    db.sale.findMany({
      where: { farmerId, tenantId: ctx.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, product: true, quantity: true, totalAmount: true, netAmount: true, loanDeducted: true, status: true, createdAt: true },
    }),
    db.vslaLoan.findMany({
      where: { farmerId, status: { in: ['DISBURSED', 'OUTSTANDING', 'OVERDUE'] } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, amount: true, totalRepayable: true, amountRepaid: true, status: true, createdAt: true, vslaGroup: { select: { name: true } } },
    }),
    db.trainingAttendance.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, training: { select: { topic: true, date: true, location: true } }, attended: true, createdAt: true },
    }),
    db.farmerLedgerEntry.findMany({
      where: { farmerId, tenantId: ctx.tenantId },
      orderBy: { date: 'desc' },
      take: 30,
      select: { id: true, type: true, description: true, amount: true, balanceAfter: true, date: true },
    }),
    db.inputDistribution.findMany({
      where: { farmerId, tenantId: ctx.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, inputType: true, quantity: true, totalCost: true, balanceRemaining: true, status: true, createdAt: true },
    }),
  ])

  const totalIncome = sales.reduce((s, x) => s + (x.netAmount || 0), 0)
  const totalLoanRepaid = sales.reduce((s, x) => s + (x.loanDeducted || 0), 0)
  const outstandingLoans = loans.reduce((s, l) => s + Math.max(0, (l.totalRepayable ?? l.amount) - l.amountRepaid), 0)
  const inputBalanceTotal = inputDistributions.reduce((s, i) => s + (i.balanceRemaining || 0), 0)
  const currentBalance = ledger[0]?.balanceAfter || 0

  return NextResponse.json({
    role: ctx.role,
    dashboardType: 'farmer',
    farmer,
    summary: {
      totalSales: sales.length,
      totalIncome,
      totalLoanRepaid,
      outstandingLoans,
      outstandingInputs: inputBalanceTotal,
      currentBalance,
      trainingsAttended: trainings.filter(t => t.attended).length,
    },
    recentSales: sales.slice(0, 10),
    activeLoans: loans,
    recentTrainings: trainings.slice(0, 5),
    recentLedger: ledger.slice(0, 10),
    inputDistributions,
  })
}