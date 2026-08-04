/**
 * VSLA V2 — Record Cashbox Entry
 * SRS 5.2: E-Teller records Savings / Loans / Welfare / Fines → Update Group Cashbox
 * 
 * This is the E-Teller's primary action during a meeting.
 * Each entry updates the group's cashboxBalance and creates a master transaction.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { logSecureAction } from '@/lib/security/secure-audit-logger'
import { z } from 'zod'

const CashboxEntrySchema = z.object({
  type: z.enum(['SAVING_IN', 'LOAN_OUT', 'LOAN_REPAY_IN', 'WELFARE_IN', 'FINE_IN', 'WELFARE_OUT']),
  amount: z.number().positive().max(5_000_000, 'Max: UGX 5M per entry'),
  memberId: z.string().optional(),
  loanId: z.string().optional(),
  meetingId: z.string().optional(),
  description: z.string().max(500).optional(),
  recordedByName: z.string().min(2),
}).strict()

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { groupId } = await params
    const body = await req.json()
    let validated
    try {
      validated = CashboxEntrySchema.parse(body)
    } catch (err: any) {
      return NextResponse.json({
        error: 'Validation failed',
        fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [],
      }, { status: 400 })
    }

    // Get group with current cashbox balance
    const group = await db.vslaGroupV2.findUnique({ where: { id: groupId } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    // Determine direction (IN = cashbox increases, OUT = cashbox decreases)
    const direction = validated.type.endsWith('_IN') ? 'IN' : 'OUT'
    const balanceBefore = group.cashboxBalance
    const balanceAfter = direction === 'IN'
      ? balanceBefore + validated.amount
      : balanceBefore - validated.amount

    // Update group cashbox
    await db.vslaGroupV2.update({
      where: { id: groupId },
      data: { cashboxBalance: balanceAfter },
    })

    // Create cashbox entry
    const transactionRef = `CB-${Date.now().toString(36).toUpperCase()}`
    const entry = await db.vslaCashboxEntryV2.create({
      data: {
        groupId,
        meetingId: validated.meetingId,
        type: validated.type,
        amount: validated.amount,
        balanceBefore,
        balanceAfter,
        memberId: validated.memberId,
        loanId: validated.loanId,
        transactionRef,
        description: validated.description,
        recordedById: ctx.userId,
        recordedByName: validated.recordedByName,
      },
    })

    // Create master transaction
    const transactionTypeMap: Record<string, string> = {
      SAVING_IN: 'SAVING',
      LOAN_OUT: 'LOAN_DISBURSEMENT',
      LOAN_REPAY_IN: 'LOAN_REPAYMENT',
      WELFARE_IN: 'WELFARE_CONTRIBUTION',
      FINE_IN: 'FINE',
      WELFARE_OUT: 'WELFARE_CLAIM',
    }
    await db.vslaTransactionV2.create({
      data: {
        groupId,
        memberId: validated.memberId,
        meetingId: validated.meetingId,
        loanId: validated.loanId,
        type: transactionTypeMap[validated.type] || validated.type,
        amount: validated.amount,
        direction,
        description: validated.description || `${validated.type} entry`,
        transactionRef,
        status: 'COMPLETED',
        recordedById: ctx.userId,
        recordedByName: validated.recordedByName,
      },
    })

    // ─── If SAVING_IN: update member's totalSavings + totalShares ───
    if (validated.type === 'SAVING_IN' && validated.memberId) {
      const sharesBought = Math.floor(validated.amount / group.sharePrice)
      await db.vslaMemberV2.update({
        where: { id: validated.memberId },
        data: {
          totalSavings: { increment: validated.amount },
          totalShares: { increment: sharesBought },
          // SRS 3.4: First share purchase activates the member
          status: 'ACTIVE',
          activatedAt: new Date(),
        },
      })
    }

    // ─── If LOAN_REPAY_IN: update loan's amountRepaid + outstanding ───
    if (validated.type === 'LOAN_REPAY_IN' && validated.loanId) {
      const loan = await db.vslaLoanV2.findUnique({ where: { id: validated.loanId } })
      if (loan) {
        const newAmountRepaid = loan.amountRepaid + validated.amount
        const newOutstanding = Math.max(0, loan.totalRepayable - newAmountRepaid)
        const isFullyRepaid = newAmountRepaid >= loan.totalRepayable
        await db.vslaLoanV2.update({
          where: { id: validated.loanId },
          data: {
            amountRepaid: newAmountRepaid,
            outstanding: newOutstanding,
            status: isFullyRepaid ? 'REPAID' : loan.status,
            repaidAt: isFullyRepaid ? new Date() : null,
            closedAt: isFullyRepaid ? new Date() : null,
          },
        })
      }
    }

    await logSecureAction({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorRole: ctx.role,
      action: `VSLA_V2_CASHBOX_${validated.type}`,
      entityType: 'VslaCashboxEntryV2',
      entityId: entry.id,
      description: `Cashbox entry: ${validated.type} UGX ${validated.amount} — cashbox ${balanceBefore} → ${balanceAfter}`,
      metadata: {
        type: validated.type,
        amount: validated.amount,
        balanceBefore,
        balanceAfter,
        memberId: validated.memberId,
        loanId: validated.loanId,
        meetingId: validated.meetingId,
      },
      httpMethod: 'POST',
      path: `/api/vsla-v2/cashbox/${groupId}/entry`,
    })

    return NextResponse.json({
      entry,
      cashboxBalance: balanceAfter,
      message: 'Cashbox entry recorded.',
    }, { status: 201 })
  } catch (error) {
    console.error('[vsla-v2/cashbox/entry POST] error:', error)
    return NextResponse.json({ error: 'Failed to record cashbox entry' }, { status: 500 })
  }
}
