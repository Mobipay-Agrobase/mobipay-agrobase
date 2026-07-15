/**
 * GET /api/vsla/cron/penalties?key=<CRON_SECRET>
 * Daily cron: applies post-maturity interest + late fees on overdue loans.
 * Per V2 spec: monthly interest on outstanding principal + late fee after grace days.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const cronSecret = process.env.IMPACT_CRON_SECRET || process.env.CRON_SECRET
    if (!cronSecret || key !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const overdueLoans = await db.vslaLoan.findMany({
      where: { status: 'OVERDUE' },
      include: {
        vslaGroup: {
          select: { postMaturityInterestRate: true, lateFeeAmount: true, graceDays: true, autoPenaltyEnabled: true }
        },
      },
    })

    let penaltiesApplied = 0
    let totalPenaltyAmount = 0

    for (const loan of overdueLoans) {
      if (!loan.dueDate) continue
      const group = loan.vslaGroup
      if (!group.autoPenaltyEnabled) continue

      const daysOverdue = Math.floor((Date.now() - loan.dueDate.getTime()) / 86400000)
      const outstanding = loan.totalRepayable - loan.amountRepaid

      // Post-maturity interest: monthly (every 30 days)
      if (group.postMaturityInterestRate > 0 && daysOverdue > 0 && daysOverdue % 30 === 0) {
        const interest = outstanding * group.postMaturityInterestRate / 100
        if (interest > 0) {
          await db.vslaLoanPenalty.create({
            data: {
              loanId: loan.id,
              penaltyType: 'post_maturity_interest',
              amount: interest,
            },
          })
          totalPenaltyAmount += interest
          penaltiesApplied++
        }
      }

      // Late fee: once, after grace days + 1
      const graceDays = group.graceDays || 7
      if (daysOverdue === graceDays + 1 && group.lateFeeAmount > 0) {
        const existingLateFee = await db.vslaLoanPenalty.findFirst({
          where: { loanId: loan.id, penaltyType: 'late_fee' },
        })
        if (!existingLateFee) {
          await db.vslaLoanPenalty.create({
            data: {
              loanId: loan.id,
              penaltyType: 'late_fee',
              amount: group.lateFeeAmount,
            },
          })
          totalPenaltyAmount += group.lateFeeAmount
          penaltiesApplied++
        }
      }
    }

    return NextResponse.json({
      overdueLoansChecked: overdueLoans.length,
      penaltiesApplied,
      totalPenaltyAmount,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[vsla/cron/penalties] error:', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
