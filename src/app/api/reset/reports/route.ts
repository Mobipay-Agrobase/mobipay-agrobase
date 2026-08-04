/**
 * ReSET — Consortium Reports API
 * Returns comprehensive data for FCDO-format reports with filters.
 * 
 * Query params: settlement, partner, startDate, endDate, type
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'reset:read')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(req.url)
    const settlement = url.searchParams.get('settlement')
    const partner = url.searchParams.get('partner')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    // Build where clauses
    const benWhere: Record<string, unknown> = {}
    if (!ctx.isSuperAdmin) benWhere.tenantId = { in: ctx.tenantScope }
    if (settlement) benWhere.settlement = settlement
    if (partner) benWhere.enrolledBy = partner

    const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.gte = new Date(startDate)
      if (endDate) dateFilter.createdAt.lte = new Date(endDate)
    }

    const voucherWhere: Record<string, unknown> = { beneficiary: benWhere, ...dateFilter }
    const cashWhere: Record<string, unknown> = { beneficiary: benWhere, ...dateFilter }

    // ─── 1. Beneficiary Demographics ───
    const [bySettlement, byPartner, byGender, byStatus] = await Promise.all([
      db.resetBeneficiary.groupBy({ by: ['settlement'], _count: true, where: benWhere }),
      db.resetBeneficiary.groupBy({ by: ['enrolledBy'], _count: true, where: benWhere }),
      db.resetBeneficiary.groupBy({ by: ['gender'], _count: true, where: benWhere }),
      db.resetBeneficiary.groupBy({ by: ['status'], _count: true, where: benWhere }),
    ])

    const totalBeneficiaries = await db.resetBeneficiary.count({ where: benWhere })
    const householdResult = await db.resetBeneficiary.groupBy({ by: ['householdId'], where: benWhere })
    const totalHouseholds = householdResult.length

    // ─── 2. Voucher Metrics ───
    const [voucherStatus, voucherType, voucherBySettlement] = await Promise.all([
      db.resetVoucher.groupBy({ by: ['status'], _count: true, _sum: { amount: true }, where: voucherWhere }),
      db.resetVoucher.groupBy({ by: ['type'], _count: true, _sum: { amount: true }, where: voucherWhere }),
      db.resetVoucher.findMany({ where: voucherWhere, include: { beneficiary: { select: { settlement: true } } } }),
    ])

    const totalVouchers = await db.resetVoucher.count({ where: voucherWhere })
    const totalVoucherAmount = await db.resetVoucher.aggregate({ where: voucherWhere, _sum: { amount: true } })
    const redeemedVouchers = voucherStatus.find(v => v.status === 'REDEEMED')
    const redemptionRate = totalVouchers > 0 ? Math.round(((redeemedVouchers?._count ?? 0) / totalVouchers) * 100) : 0

    // Voucher by settlement
    const voucherSettlementMap: Record<string, { count: number; amount: number }> = {}
    for (const v of voucherBySettlement) {
      const s = v.beneficiary?.settlement || 'Unknown'
      if (!voucherSettlementMap[s]) voucherSettlementMap[s] = { count: 0, amount: 0 }
      voucherSettlementMap[s].count++
      voucherSettlementMap[s].amount += v.amount
    }

    // ─── 3. Cash Disbursement Metrics ───
    const [cashStatus, cashByPartner, cashBySettlement] = await Promise.all([
      db.resetCashDisbursement.groupBy({ by: ['status'], _count: true, _sum: { amount: true }, where: cashWhere }),
      db.resetCashDisbursement.groupBy({ by: ['partner'], _count: true, _sum: { amount: true }, where: cashWhere }),
      db.resetCashDisbursement.findMany({ where: cashWhere, include: { beneficiary: { select: { settlement: true } } } }),
    ])

    const totalCashDisbursed = await db.resetCashDisbursement.aggregate({ where: { ...cashWhere, status: { in: ['SENT', 'CONFIRMED'] } }, _sum: { amount: true } })
    const totalCashConfirmed = await db.resetCashDisbursement.aggregate({ where: { ...cashWhere, status: 'CONFIRMED' }, _sum: { amount: true } })
    const confirmationRate = totalCashDisbursed._sum.amount && totalCashDisbursed._sum.amount > 0
      ? Math.round(((totalCashConfirmed._sum.amount ?? 0) / totalCashDisbursed._sum.amount) * 100)
      : 0

    // Cash by settlement
    const cashSettlementMap: Record<string, { count: number; amount: number }> = {}
    for (const c of cashBySettlement) {
      const s = c.beneficiary?.settlement || 'Unknown'
      if (!cashSettlementMap[s]) cashSettlementMap[s] = { count: 0, amount: 0 }
      cashSettlementMap[s].count++
      cashSettlementMap[s].amount += c.amount
    }

    // ─── 4. Merchant Performance ───
    const merchantWhere: Record<string, unknown> = {}
    if (!ctx.isSuperAdmin) merchantWhere.tenantId = { in: ctx.tenantScope }
    if (settlement) merchantWhere.settlement = settlement

    const [merchantsBySettlement, merchantsByStatus, merchantsByType] = await Promise.all([
      db.resetMerchant.groupBy({ by: ['settlement'], _count: true, _sum: { payoutAmount: true }, where: merchantWhere }),
      db.resetMerchant.groupBy({ by: ['status'], _count: true, where: merchantWhere }),
      db.resetMerchant.groupBy({ by: ['businessType'], _count: true, where: merchantWhere }),
    ])

    const totalMerchants = await db.resetMerchant.count({ where: merchantWhere })
    const totalPendingPayouts = await db.resetMerchant.aggregate({ where: merchantWhere, _sum: { payoutAmount: true } })

    // ─── 5. Field Agent Performance ───
    const agentWhere: Record<string, unknown> = {}
    if (!ctx.isSuperAdmin) agentWhere.tenantId = { in: ctx.tenantScope }
    if (settlement) agentWhere.settlement = settlement

    const agents = await db.resetFieldAgent.findMany({
      where: agentWhere,
      select: { fullName: true, agentType: true, settlement: true, beneficiariesEnrolled: true, merchantsOnboarded: true, vouchersDistributed: true },
      orderBy: { beneficiariesEnrolled: 'desc' },
    })

    // ─── 6. Unit Metrics (FCDO format) ───
    const unitMetrics = {
      totalBeneficiaries,
      totalHouseholds: totalHouseholds,
      totalVouchers,
      totalVoucherAmount: totalVoucherAmount._sum.amount ?? 0,
      redeemedVouchers: redeemedVouchers?._count ?? 0,
      redeemedAmount: redeemedVouchers?._sum?.amount ?? 0,
      redemptionRate,
      totalCashDisbursed: totalCashDisbursed._sum.amount ?? 0,
      totalCashConfirmed: totalCashConfirmed._sum.amount ?? 0,
      confirmationRate,
      totalMerchants,
      approvedMerchants: merchantsByStatus.find(m => m.status === 'APPROVED')?._count ?? 0,
      pendingMerchants: merchantsByStatus.find(m => m.status === 'PENDING')?._count ?? 0,
      totalPendingPayouts: totalPendingPayouts._sum.payoutAmount ?? 0,
      totalAgents: agents.length,
      avgBeneficiariesPerAgent: agents.length > 0 ? Math.round(agents.reduce((s, a) => s + a.beneficiariesEnrolled, 0) / agents.length) : 0,
    }

    return NextResponse.json({
      unitMetrics,
      demographics: {
        bySettlement: bySettlement.map(s => ({ name: s.settlement, count: s._count })),
        byPartner: byPartner.map(p => ({ name: p.enrolledBy, count: p._count })),
        byGender: byGender.map(g => ({ name: g.gender || 'Unknown', count: g._count })),
        byStatus: byStatus.map(s => ({ name: s.status, count: s._count })),
      },
      vouchers: {
        byStatus: voucherStatus.map(v => ({ name: v.status, count: v._count, amount: v._sum.amount ?? 0 })),
        byType: voucherType.map(v => ({ name: v.type, count: v._count, amount: v._sum.amount ?? 0 })),
        bySettlement: Object.entries(voucherSettlementMap).map(([name, data]) => ({ name, count: data.count, amount: data.amount })),
        redemptionRate,
      },
      cash: {
        byStatus: cashStatus.map(c => ({ name: c.status, count: c._count, amount: c._sum.amount ?? 0 })),
        byPartner: cashByPartner.map(c => ({ name: c.partner, count: c._count, amount: c._sum.amount ?? 0 })),
        bySettlement: Object.entries(cashSettlementMap).map(([name, data]) => ({ name, count: data.count, amount: data.amount })),
        confirmationRate,
      },
      merchants: {
        bySettlement: merchantsBySettlement.map(m => ({ name: m.settlement, count: m._count, payout: m._sum.payoutAmount ?? 0 })),
        byStatus: merchantsByStatus.map(m => ({ name: m.status, count: m._count })),
        byType: merchantsByType.map(m => ({ name: m.businessType, count: m._count })),
      },
      agents,
    })
  } catch (error) {
    console.error('[reset/reports]', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
