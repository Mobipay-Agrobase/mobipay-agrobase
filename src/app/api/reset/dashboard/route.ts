import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'reset:read')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const where: Record<string, unknown> = {}
    if (!ctx.isSuperAdmin) where.tenantId = { in: ctx.tenantScope }

    const [beneficiaries, vouchers, merchants, cashDisbursed, redemptions] = await Promise.all([
      db.resetBeneficiary.count({ where }),
      db.resetVoucher.count({ where: { beneficiary: where } }),
      db.resetMerchant.count({ where }),
      db.resetCashDisbursement.aggregate({ where: { beneficiary: where, status: 'CONFIRMED' }, _sum: { amount: true } }),
      db.resetVoucherRedemption.count({ where: { beneficiary: where } }),
    ])

    // By settlement
    const bySettlement = await db.resetBeneficiary.groupBy({
      by: ['settlement'],
      _count: true,
      where,
    })

    // By partner
    const byPartner = await db.resetBeneficiary.groupBy({
      by: ['enrolledBy'],
      _count: true,
      where,
    })

    // By gender
    const byGender = await db.resetBeneficiary.groupBy({
      by: ['gender'],
      _count: true,
      where,
    })

    // Voucher status breakdown
    const voucherStatus = await db.resetVoucher.groupBy({
      by: ['status'],
      _count: true,
      where: { beneficiary: where },
    })

    return NextResponse.json({
      counts: { beneficiaries, vouchers, merchants, redemptions },
      financials: {
        cashDisbursed: cashDisbursed._sum.amount || 0,
      },
      breakdowns: {
        bySettlement: bySettlement.map(s => ({ name: s.settlement, count: s._count })),
        byPartner: byPartner.map(p => ({ name: p.enrolledBy, count: p._count })),
        byGender: byGender.map(g => ({ name: g.gender || 'Unknown', count: g._count })),
        voucherStatus: voucherStatus.map(v => ({ name: v.status, count: v._count })),
      },
    })
  } catch (error) {
    console.error('[reset/dashboard]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
