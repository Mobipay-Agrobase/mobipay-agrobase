/**
 * VSLA V2 — Loan Eligibility Check
 * SRS 5.1: Auto-eligibility before human approval
 * Checks: active saver, no outstanding loan, within limit, no pending fines/welfare
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const EligibilitySchema = z.object({
  groupId: z.string().min(1),
  memberId: z.string().min(1),
  amount: z.number().positive(),
}).strict()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let validated
    try {
      validated = EligibilitySchema.parse(body)
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

    const checks: Array<{ check: string; passed: boolean; reason?: string; maxEligible?: number }> = []

    // ─── Check 1: Active saver (must have at least 1 savings transaction) ───
    const savingsCount = await db.vslaTransactionV2.count({
      where: { memberId: validated.memberId, groupId: validated.groupId, type: 'SAVING', status: 'COMPLETED' },
    })
    const activeSaver = savingsCount > 0
    checks.push({
      check: 'ACTIVE_SAVER',
      passed: activeSaver,
      reason: activeSaver ? undefined : 'No savings records found. Member must save at least once before borrowing.',
    })

    // ─── Check 2: No outstanding loan ───
    const outstandingLoan = await db.vslaLoanV2.findFirst({
      where: {
        memberId: validated.memberId,
        groupId: validated.groupId,
        status: { in: ['SYSTEM_APPROVED', 'KEYHOLDER_APPROVED', 'DISBURSED'] },
      },
    })
    const noOutstanding = !outstandingLoan
    checks.push({
      check: 'NO_OUTSTANDING_LOAN',
      passed: noOutstanding,
      reason: noOutstanding ? undefined : 'Outstanding loan exists. Repay current loan before applying for a new one.',
    })

    // ─── Check 3: Within loan limit (amount <= savings × multiplier) ───
    const totalSavings = member.totalSavings
    const maxEligible = totalSavings * group.loanMultiplier
    const withinLimit = validated.amount <= maxEligible
    checks.push({
      check: 'WITHIN_LOAN_LIMIT',
      passed: withinLimit,
      reason: withinLimit ? undefined : `Amount exceeds eligibility. Max: UGX ${maxEligible.toLocaleString()} (savings ${totalSavings.toLocaleString()} × multiplier ${group.loanMultiplier})`,
      maxEligible,
    })

    // ─── Check 4: No pending fines ───
    // (V2 doesn't have a separate fines model yet — fines are tracked as transactions)
    // For now, check if there are any outstanding FINE transactions that haven't been paid
    const pendingFines = await db.vslaTransactionV2.count({
      where: {
        memberId: validated.memberId,
        groupId: validated.groupId,
        type: 'FINE',
        status: 'PENDING',
      },
    })
    const noPendingFines = pendingFines === 0
    checks.push({
      check: 'NO_PENDING_FINES',
      passed: noPendingFines,
      reason: noPendingFines ? undefined : `${pendingFines} pending fine(s) must be paid first.`,
    })

    // ─── Overall result ───
    const allPassed = checks.every(c => c.passed)
    const failReasons = checks.filter(c => !c.passed).map(c => c.reason).filter(Boolean)

    return NextResponse.json({
      eligible: allPassed,
      checks,
      maxEligibleAmount: maxEligible,
      failReasons: allPassed ? undefined : failReasons,
    })
  } catch (error) {
    console.error('[vsla-v2/eligibility-check POST] error:', error)
    return NextResponse.json({ error: 'Failed to check eligibility' }, { status: 500 })
  }
}
