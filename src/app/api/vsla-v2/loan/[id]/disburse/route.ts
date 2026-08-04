/**
 * VSLA V2 — Loan Disbursement
 * SRS 5.1: After unanimous key-holder approval, Group Admin or E-Teller disburses
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { logSecureAction } from '@/lib/security/secure-audit-logger'
import { z } from 'zod'
import { sendSms, sendBulkSms, buildLoanDisbursedSms } from '@/lib/vsla-v2/sms'

const DisburseSchema = z.object({
  disbursedByName: z.string().min(2),
  disbursementMethod: z.enum(['CASH', 'MOBILE_MONEY']).default('CASH'),
}).strict()

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: loanId } = await params
    const body = await req.json()
    let validated
    try {
      validated = DisburseSchema.parse(body)
    } catch (err: any) {
      return NextResponse.json({
        error: 'Validation failed',
        fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [],
      }, { status: 400 })
    }

    const loan = await db.vslaLoanV2.findUnique({
      where: { id: loanId },
      include: { group: true, member: true },
    })
    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })

    if (loan.status !== 'KEYHOLDER_APPROVED') {
      return NextResponse.json({
        error: 'Loan must have unanimous key-holder approval before disbursement',
        currentStatus: loan.status,
      }, { status: 400 })
    }

    // ─── Disburse the loan ───
    const updatedLoan = await db.vslaLoanV2.update({
      where: { id: loanId },
      data: {
        status: 'DISBURSED',
        disbursedAt: new Date(),
        disbursedById: ctx.userId,
        disbursedByName: validated.disbursedByName,
      },
    })

    // ─── Update group cashbox (loan out = cashbox decreases) ───
    const balanceBefore = loan.group.cashboxBalance
    const balanceAfter = balanceBefore - loan.amount
    await db.vslaGroupV2.update({
      where: { id: loan.groupId },
      data: { cashboxBalance: balanceAfter },
    })

    // Record cashbox entry
    await db.vslaCashboxEntryV2.create({
      data: {
        groupId: loan.groupId,
        type: 'LOAN_OUT',
        amount: loan.amount,
        balanceBefore,
        balanceAfter,
        memberId: loan.memberId,
        loanId: loan.id,
        transactionRef: `CB-${Date.now().toString(36).toUpperCase()}`,
        description: `Loan disbursement to ${loan.member.fullName}`,
        recordedById: ctx.userId,
        recordedByName: validated.disbursedByName,
      },
    })

    // Record master transaction
    await db.vslaTransactionV2.create({
      data: {
        groupId: loan.groupId,
        memberId: loan.memberId,
        loanId: loan.id,
        type: 'LOAN_DISBURSEMENT',
        amount: loan.amount,
        direction: 'OUT',
        description: `Loan disbursement: ${loan.purpose}`,
        transactionRef: loan.transactionRef,
        status: 'COMPLETED',
        recordedById: ctx.userId,
        recordedByName: validated.disbursedByName,
      },
    })

    // ─── Send SMS to member + all key holders (SRS 5.1) ───
    const disbursedMsg = buildLoanDisbursedSms({
      memberName: loan.member.fullName,
      amount: loan.amount,
      groupName: loan.group.name,
    })
    const memberSmsResult = await sendSms(loan.member.phone, disbursedMsg)
    console.log(`[SMS] Disbursement notification to member ${loan.member.phone}: ${memberSmsResult.success ? 'sent' : memberSmsResult.error}`)

    // Notify all key holders
    const keyHolders = await db.vslaKeyHolderV2.findMany({
      where: { groupId: loan.groupId, status: 'ACTIVE' },
      select: { phone: true },
    })
    const khResult = await sendBulkSms(keyHolders.map(kh => kh.phone), `Loan disbursed: UGX ${loan.amount.toLocaleString()} to ${loan.member.fullName} in ${loan.group.name}. — MobiPay Agrobase`)
    console.log(`[SMS] Disbursement notification to ${khResult.sent}/${keyHolders.length} key holders`)

    await logSecureAction({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorRole: ctx.role,
      action: 'VSLA_V2_LOAN_DISBURSED',
      entityType: 'VslaLoanV2',
      entityId: loanId,
      description: `Loan ${loan.transactionRef} disbursed: UGX ${loan.amount} to ${loan.member.fullName}`,
      metadata: {
        amount: loan.amount,
        memberId: loan.memberId,
        memberName: loan.member.fullName,
        disbursementMethod: validated.disbursementMethod,
        cashboxBefore: balanceBefore,
        cashboxAfter: balanceAfter,
      },
      httpMethod: 'POST',
      path: `/api/vsla-v2/loan/${loanId}/disburse`,
    })

    return NextResponse.json({
      loan: updatedLoan,
      cashboxBalance: balanceAfter,
      message: 'Loan disbursed. SMS sent to member and key holders.',
    })
  } catch (error) {
    console.error('[vsla-v2/loan/disburse POST] error:', error)
    return NextResponse.json({ error: 'Failed to disburse loan' }, { status: 500 })
  }
}
