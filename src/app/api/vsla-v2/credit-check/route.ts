/**
 * VSLA V2 → MFI Credit Check
 * ──────────────────────────
 * Called by the MFI loan module before approving an institutional loan.
 * Returns a recommendation based on the farmer's VSLA repayment history.
 * 
 * Usage: POST /api/vsla-v2/credit-check
 * Body: { phone: "+256...", requestedAmount: 500000 }
 * 
 * Returns: {
 *   eligible: boolean,
 *   vslaCreditScore: number (0-100),
 *   riskCategory: 'LOW' | 'MEDIUM' | 'HIGH',
 *   maxRecommendedAmount: number,
 *   recommendations: string[],
 *   vslaProfile: { ... }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const CreditCheckSchema = z.object({
  phone: z.string().min(10),
  requestedAmount: z.number().positive(),
}).strict()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let validated
    try {
      validated = CreditCheckSchema.parse(body)
    } catch (err: any) {
      return NextResponse.json({
        error: 'Validation failed',
        fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [],
      }, { status: 400 })
    }

    // Normalize phone
    let phone = validated.phone
    if (!phone.startsWith('+')) phone = '+' + phone

    // Find VSLA member by phone
    const member = await db.vslaMemberV2.findFirst({
      where: { phone },
      include: {
        group: { select: { name: true, sharePrice: true, loanMultiplier: true } },
      },
    })

    if (!member) {
      // No VSLA history — not necessarily a rejection, but no VSLA data to support the application
      return NextResponse.json({
        eligible: true, // Allow — just no VSLA history to boost the application
        vslaCreditScore: null,
        riskCategory: 'UNKNOWN',
        maxRecommendedAmount: validated.requestedAmount,
        recommendations: ['No VSLA history found for this farmer. Consider enrolling them in a VSLA group to build credit history.'],
        vslaProfile: null,
      })
    }

    // Get loans
    const loans = await db.vslaLoanV2.findMany({
      where: { memberId: member.id },
      select: {
        amount: true,
        totalRepayable: true,
        amountRepaid: true,
        outstanding: true,
        status: true,
        repaidAt: true,
        expectedRepaymentDate: true,
      },
    })

    // Calculate metrics
    const totalLoans = loans.length
    const defaulted = loans.filter(l => ['WRITTEN_OFF'].includes(l.status)).length
    const overdue = loans.filter(l => l.status === 'OVERDUE').length
    const repaid = loans.filter(l => l.status === 'REPAID')
    const active = loans.filter(l => ['DISBURSED', 'OVERDUE'].includes(l.status))

    const totalBorrowed = loans.reduce((s, l) => s + l.amount, 0)
    const totalRepaid = loans.reduce((s, l) => s + l.amountRepaid, 0)
    const totalRepayable = loans.filter(l => ['DISBURSED', 'REPAID', 'OVERDUE'].includes(l.status)).reduce((s, l) => s + l.totalRepayable, 0)
    const repaymentRate = totalRepayable > 0 ? (totalRepaid / totalRepayable) * 100 : 100

    const onTimeRepaid = repaid.filter(l => l.repaidAt && l.expectedRepaymentDate && new Date(l.repaidAt) <= new Date(l.expectedRepaymentDate))
    const onTimeRate = repaid.length > 0 ? (onTimeRepaid.length / repaid.length) * 100 : 100

    // VSLA Credit Score
    const repaymentScore = Math.min(100, repaymentRate) * 0.40
    const onTimeScore = Math.min(100, onTimeRate) * 0.30
    const savingsScore = member.totalShares > 0 ? Math.min(100, (member.totalShares / 10) * 100) * 0.15 : 0
    const activeOutstanding = active.reduce((s, l) => s + l.outstanding, 0)
    const debtBurdenScore = activeOutstanding === 0 ? 15 : Math.max(0, 15 - (activeOutstanding / 100000) * 5)
    const vslaCreditScore = Math.round(repaymentScore + onTimeScore + savingsScore + debtBurdenScore)

    let riskCategory = 'LOW'
    if (vslaCreditScore < 50) riskCategory = 'HIGH'
    else if (vslaCreditScore < 75) riskCategory = 'MEDIUM'

    // ─── Eligibility decision ───
    let eligible = true
    let maxRecommendedAmount = validated.requestedAmount
    const recommendations: string[] = []

    if (defaulted > 0) {
      eligible = false
      recommendations.push(`REJECTED: ${defaulted} VSLA loan write-off(s) — high risk of default`)
    }

    if (overdue > 0 && eligible) {
      // Allow but reduce recommended amount
      maxRecommendedAmount = Math.min(validated.requestedAmount, member.totalSavings * 2)
      recommendations.push(`CAUTION: ${overdue} overdue VSLA loan(s) — recommended amount reduced to UGX ${maxRecommendedAmount.toLocaleString()}`)
    }

    if (eligible && vslaCreditScore >= 80) {
      // Strong VSLA history — can support full requested amount + preferential rates
      maxRecommendedAmount = validated.requestedAmount * 1.5 // 50% more than requested
      recommendations.push(`EXCELLENT: VSLA credit score ${vslaCreditScore}/100 — eligible for preferential rates and higher amount (up to UGX ${maxRecommendedAmount.toLocaleString()})`)
    }

    if (eligible && vslaCreditScore >= 60 && vslaCreditScore < 80) {
      recommendations.push(`GOOD: VSLA credit score ${vslaCreditScore}/100 — standard rates apply`)
    }

    if (eligible && vslaCreditScore < 60) {
      maxRecommendedAmount = Math.min(validated.requestedAmount, member.totalSavings * 3)
      recommendations.push(`CAUTION: VSLA credit score ${vslaCreditScore}/100 — amount limited to UGX ${maxRecommendedAmount.toLocaleString()}`)
    }

    // Active VSLA outstanding debt
    if (activeOutstanding > 0) {
      recommendations.push(`INFO: Active VSLA debt of UGX ${activeOutstanding.toLocaleString()} — factor into debt-to-income ratio`)
    }

    return NextResponse.json({
      eligible,
      vslaCreditScore,
      riskCategory,
      maxRecommendedAmount,
      recommendations,
      vslaProfile: {
        memberId: member.memberId,
        fullName: member.fullName,
        group: member.group.name,
        totalShares: member.totalShares,
        totalSavings: member.totalSavings,
        totalLoans,
        repaidLoans: repaid.length,
        activeLoans: active.length,
        overdueLoans: overdue,
        defaultedLoans: defaulted,
        repaymentRate: Math.round(repaymentRate),
        onTimeRate: Math.round(onTimeRate),
        activeOutstanding,
      },
    })
  } catch (error) {
    console.error('[vsla-v2/credit-check] error:', error)
    return NextResponse.json({ error: 'Failed to perform credit check' }, { status: 500 })
  }
}
