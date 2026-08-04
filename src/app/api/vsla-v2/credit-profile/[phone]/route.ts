/**
 * VSLA V2 — Credit Profile API
 * ──────────────────────────────
 * Returns a member's VSLA credit history for use by other modules:
 * - Loan Management (MFI) → checks VSLA repayment before approving institutional loans
 * - Credit Scoring Engine → feeds VSLA data into the 4-factor model
 * - Farmer Profile → shows VSLA passbook summary
 * 
 * Usage: GET /api/vsla-v2/credit-profile/+256700100001
 * 
 * No auth required — this is a read-only API consumed by other internal modules.
 * Returns: member info, loan history, repayment rate, savings, shares, attendance.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ phone: string }> }) {
  try {
    const { phone: phoneParam } = await params

    // Normalize phone number
    let phone = decodeURIComponent(phoneParam)
    if (!phone.startsWith('+')) phone = '+' + phone

    // Find VSLA V2 member by phone
    const member = await db.vslaMemberV2.findFirst({
      where: { phone },
      include: {
        group: { select: { name: true, code: true, sharePrice: true, loanMultiplier: true } },
      },
    })

    if (!member) {
      return NextResponse.json({
        found: false,
        message: 'No VSLA member found with this phone number',
      })
    }

    // Get all loans
    const loans = await db.vslaLoanV2.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        interestRate: true,
        totalRepayable: true,
        amountRepaid: true,
        outstanding: true,
        purpose: true,
        status: true,
        applicationDate: true,
        disbursedAt: true,
        expectedRepaymentDate: true,
        repaidAt: true,
        transactionRef: true,
      },
    })

    // Get all transactions
    const transactions = await db.vslaTransactionV2.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        type: true,
        amount: true,
        direction: true,
        description: true,
        transactionRef: true,
        createdAt: true,
        status: true,
      },
    })

    // Get meeting attendance
    const attendance = await db.vslaMeetingAttendanceV2.findMany({
      where: { memberId: member.id },
      include: {
        meeting: { select: { title: true, meetingDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // ─── Calculate credit metrics ───
    const totalLoans = loans.length
    const activeLoans = loans.filter(l => ['DISBURSED', 'OVERDUE'].includes(l.status))
    const repaidLoans = loans.filter(l => l.status === 'REPAID')
    const defaultedLoans = loans.filter(l => ['REJECTED', 'WRITTEN_OFF'].includes(l.status))
    const overdueLoans = loans.filter(l => l.status === 'OVERDUE')

    const totalBorrowed = loans.reduce((sum, l) => sum + l.amount, 0)
    const totalRepaid = loans.reduce((sum, l) => sum + l.amountRepaid, 0)
    const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstanding, 0)

    // Repayment rate = total repaid / total repayable for disbursed+repaid loans
    const disbursedLoans = loans.filter(l => ['DISBURSED', 'REPAID', 'OVERDUE'].includes(l.status))
    const totalRepayable = disbursedLoans.reduce((sum, l) => sum + l.totalRepayable, 0)
    const repaymentRate = totalRepayable > 0 ? (totalRepaid / totalRepayable) * 100 : 100

    // On-time repayment rate (loans repaid before due date)
    const onTimeRepaid = repaidLoans.filter(l => l.repaidAt && l.expectedRepaymentDate && new Date(l.repaidAt) <= new Date(l.expectedRepaymentDate))
    const onTimeRate = repaidLoans.length > 0 ? (onTimeRepaid.length / repaidLoans.length) * 100 : 100

    // Attendance rate
    const meetingsAttended = attendance.filter(a => a.present).length
    const totalMeetings = attendance.length
    const attendanceRate = totalMeetings > 0 ? (meetingsAttended / totalMeetings) * 100 : 0

    // ─── VSLA Credit Score (0-100) ───
    // Based on: repayment rate (40%), on-time rate (30%), attendance (15%), savings discipline (15%)
    const repaymentScore = Math.min(100, repaymentRate) * 0.40
    const onTimeScore = Math.min(100, onTimeRate) * 0.30
    const attendanceScore = attendanceRate * 0.15
    const savingsScore = member.totalSavings > 0 ? Math.min(100, (member.totalShares / 10) * 100) * 0.15 : 0
    const vslaCreditScore = Math.round(repaymentScore + onTimeScore + attendanceScore + savingsScore)

    // Risk category
    let riskCategory = 'LOW'
    if (vslaCreditScore < 50) riskCategory = 'HIGH'
    else if (vslaCreditScore < 75) riskCategory = 'MEDIUM'

    // ─── Recommendations for MFI ───
    const recommendations: string[] = []
    if (defaultedLoans.length > 0) {
      recommendations.push(`CAUTION: ${defaultedLoans.length} defaulted/written-off loan(s) in VSLA history`)
    }
    if (overdueLoans.length > 0) {
      recommendations.push(`WARNING: ${overdueLoans.length} overdue VSLA loan(s) — active recovery needed`)
    }
    if (repaymentRate >= 90 && defaultedLoans.length === 0) {
      recommendations.push('EXCELLENT: Strong VSLA repayment history — eligible for preferential MFI rates')
    }
    if (attendanceRate >= 80) {
      recommendations.push('GOOD: Active VSLA meeting participation — shows financial discipline')
    }
    if (member.totalShares >= 10) {
      recommendations.push(`STRONG: ${member.totalShares} shares accumulated — significant savings commitment`)
    }

    return NextResponse.json({
      found: true,
      member: {
        memberId: member.memberId,
        fullName: member.fullName,
        phone: member.phone,
        group: member.group.name,
        groupCode: member.group.code,
        status: member.status,
        joinedAt: member.joinedAt,
        totalShares: member.totalShares,
        totalSavings: member.totalSavings,
        shareValue: member.totalShares * member.group.sharePrice,
        maxLoanEligible: member.totalSavings * member.group.loanMultiplier,
      },
      creditMetrics: {
        vslaCreditScore, // 0-100
        riskCategory, // LOW | MEDIUM | HIGH
        repaymentRate: Math.round(repaymentRate), // %
        onTimeRate: Math.round(onTimeRate), // %
        attendanceRate: Math.round(attendanceRate), // %
        totalLoans,
        activeLoans: activeLoans.length,
        repaidLoans: repaidLoans.length,
        defaultedLoans: defaultedLoans.length,
        overdueLoans: overdueLoans.length,
        totalBorrowed,
        totalRepaid,
        totalOutstanding,
      },
      loanHistory: loans,
      recentTransactions: transactions,
      attendanceHistory: attendance.map(a => ({
        meeting: a.meeting.title,
        date: a.meeting.meetingDate,
        present: a.present,
        arrivedLate: a.arrivedLate,
      })),
      recommendations,
    })
  } catch (error) {
    console.error('[vsla-v2/credit-profile] error:', error)
    return NextResponse.json({ error: 'Failed to fetch credit profile' }, { status: 500 })
  }
}
