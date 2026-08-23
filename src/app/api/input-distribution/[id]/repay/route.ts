import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * POST /api/input-distribution/[id]/repay
 *
 * Record a cash installment repayment against an input distribution
 * (Ekibbo: farmer pays cash in installments).
 *
 * Body: { amount: number, note?: string }
 * Effects:
 *   · amountPaid += amount (never exceeding totalCost)
 *   · balanceRemaining recalculated
 *   · status → FULLY_REPAID | PARTIALLY_REPAID
 *   · FarmerLedgerEntry PAYMENT credit with running balance
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any
    const body = await req.json().catch(() => ({}))
    const amount = parseFloat(body.amount)

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'A positive amount is required' }, { status: 400 })
    }

    const dist = await db.inputDistribution.findFirst({
      where: { id, ...tf },
      include: { farmer: { select: { id: true, firstName: true, lastName: true } } },
    })
    if (!dist) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const totalCost = dist.totalCost || 0
    const alreadyPaid = dist.amountPaid || 0
    if (alreadyPaid >= totalCost) {
      return NextResponse.json({ error: 'This distribution is already fully repaid' }, { status: 400 })
    }

    const applied = Math.min(amount, totalCost - alreadyPaid)
    const newPaid = alreadyPaid + applied
    const newBalance = Math.max(0, totalCost - newPaid)
    const newStatus = newBalance <= 0 ? 'FULLY_REPAID' : 'PARTIALLY_REPAID'

    const updated = await db.inputDistribution.update({
      where: { id },
      data: { amountPaid: newPaid, balanceRemaining: newBalance, status: newStatus },
    })

    // Ledger credit with running balance
    const lastEntry = await db.farmerLedgerEntry.findFirst({
      where: { farmerId: dist.farmerId },
      orderBy: { date: 'desc' },
      select: { balanceAfter: true },
    })
    const runningBalance = (lastEntry?.balanceAfter || 0) + applied

    await db.farmerLedgerEntry.create({
      data: {
        tenantId: ctx.tenantId!,
        farmerId: dist.farmerId,
        type: 'PAYMENT',
        description: `Input repayment: ${dist.inputName || dist.inputType} (UGX ${applied.toLocaleString()})${body.note ? ` — ${body.note}` : ''}`,
        amount: applied,
        balanceAfter: runningBalance,
        referenceType: 'InputDistribution',
        referenceId: id,
        createdBy: ctx.userId,
        approvalStatus: 'APPROVED',
        approvedBy: ctx.userId,
      },
    })

    return NextResponse.json({ data: updated, applied })
  } catch (error: any) {
    console.error('[input repay]', error)
    return NextResponse.json({ error: 'Repayment failed', detail: error.message }, { status: 500 })
  }
}
