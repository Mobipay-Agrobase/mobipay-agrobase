/**
 * VSLA V2 — Loan Application
 * SRS 5.1: Member applies → auto-eligibility check → SYSTEM_APPROVED or SYSTEM_REJECTED
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { logSecureAction } from '@/lib/security/secure-audit-logger'
import { z } from 'zod'

const LoanApplySchema = z.object({
  groupId: z.string().min(1),
  memberId: z.string().min(1),
  amount: z.number().positive().max(10_000_000, 'Max loan: UGX 10M'),
  purpose: z.string().min(5).max(500),
  termDays: z.number().int().min(7).max(365).default(90),
}).strict()

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    let validated
    try {
      validated = LoanApplySchema.parse(body)
    } catch (err: any) {
      return NextResponse.json({
        error: 'Validation failed',
        fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [],
      }, { status: 400 })
    }

    const group = await db.vslaGroupV2.findUnique({ where: { id: validated.groupId } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const member = await db.vslaMemberV2.findUnique({ where: { id: validated.memberId } })
    if (!member || member.groupId !== validated.groupId) {
      return NextResponse.json({ error: 'Member not found in this group' }, { status: 404 })
    }

    // ─── Check for cycle freeze (SRS 5.3) ───
    const activeCycle = await db.vslaCycleV2.findFirst({
      where: { groupId: validated.groupId, status: { in: ['ACTIVE', 'FROZEN'] } },
    })
    if (activeCycle?.isFrozen) {
      return NextResponse.json({
        error: 'LOAN FREEZE active',
        reason: 'Cycle is in loan-freeze period (30 days before end). New loans are blocked. Recovery mode active.',
      }, { status: 403 })
    }

    // ─── AUTO-ELIGIBILITY CHECK (SRS 5.1) ───
    // 1. Active saver
    const savingsCount = await db.vslaTransactionV2.count({
      where: { memberId: validated.memberId, groupId: validated.groupId, type: 'SAVING', status: 'COMPLETED' },
    })
    if (savingsCount === 0) {
      return NextResponse.json({
        error: 'Auto-eligibility failed',
        reason: 'Active saver required — no savings records found.',
        eligible: false,
      }, { status: 400 })
    }

    // 2. No outstanding loan
    const outstandingLoan = await db.vslaLoanV2.findFirst({
      where: {
        memberId: validated.memberId,
        groupId: validated.groupId,
        status: { in: ['SYSTEM_APPROVED', 'KEYHOLDER_APPROVED', 'DISBURSED'] },
      },
    })
    if (outstandingLoan) {
      return NextResponse.json({
        error: 'Auto-eligibility failed',
        reason: 'Outstanding loan exists. Repay current loan first.',
        eligible: false,
      }, { status: 400 })
    }

    // 3. Within loan limit
    const maxEligible = member.totalSavings * group.loanMultiplier
    if (validated.amount > maxEligible) {
      return NextResponse.json({
        error: 'Auto-eligibility failed',
        reason: `Amount exceeds limit. Max: UGX ${maxEligible.toLocaleString()} (savings × ${group.loanMultiplier})`,
        eligible: false,
        maxEligible,
      }, { status: 400 })
    }

    // ─── Create loan with SYSTEM_APPROVED status ───
    // SRS 5.1: "Pass: Set status to System Approved and continue to key-holder approval"
    const interestRate = 10 // default 10% — could be configurable per group
    const totalRepayable = validated.amount + (validated.amount * interestRate / 100)
    const expectedRepaymentDate = new Date(Date.now() + validated.termDays * 86400000)
    const transactionRef = `LOAN-V2-${Date.now().toString(36).toUpperCase()}`

    const loan = await db.vslaLoanV2.create({
      data: {
        groupId: validated.groupId,
        memberId: validated.memberId,
        cycleId: activeCycle?.id,
        amount: validated.amount,
        interestRate,
        totalRepayable,
        outstanding: totalRepayable,
        purpose: validated.purpose,
        termDays: validated.termDays,
        eligibilityChecked: true,
        eligibilityPassed: true,
        eligibilityCheckedAt: new Date(),
        status: 'SYSTEM_APPROVED',
        systemApprovedAt: new Date(),
        expectedRepaymentDate,
        transactionRef,
      },
    })

    // ─── Notify all key holders (SRS 5.1: "Notify all 3-6 key holders") ───
    // TODO: Send SMS notification to each key holder
    const keyHolders = await db.vslaKeyHolderV2.findMany({
      where: { groupId: validated.groupId, status: 'ACTIVE' },
    })
    console.log(`[SMS] Notifying ${keyHolders.length} key holders about loan ${loan.id} pending approval`)

    await logSecureAction({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorRole: ctx.role,
      action: 'VSLA_V2_LOAN_APPLIED',
      entityType: 'VslaLoanV2',
      entityId: loan.id,
      description: `Loan application: UGX ${validated.amount} for "${validated.purpose}" — SYSTEM_APPROVED, pending ${keyHolders.length} key-holder approvals`,
      metadata: {
        amount: validated.amount,
        interestRate,
        totalRepayable,
        purpose: validated.purpose,
        groupId: validated.groupId,
        memberId: validated.memberId,
        keyHolderCount: keyHolders.length,
        maxEligible,
      },
      httpMethod: 'POST',
      path: '/api/vsla-v2/loan/apply',
    })

    return NextResponse.json({
      loan,
      eligible: true,
      keyHolderCount: keyHolders.length,
      message: `Loan auto-approved by system. Pending unanimous approval from ${keyHolders.length} key holders.`,
    }, { status: 201 })
  } catch (error) {
    console.error('[vsla-v2/loan/apply POST] error:', error)
    return NextResponse.json({ error: 'Failed to apply for loan' }, { status: 500 })
  }
}
