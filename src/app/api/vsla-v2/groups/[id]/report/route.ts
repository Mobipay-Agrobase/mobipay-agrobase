/**
 * VSLA V2 — Group Report with charts data
 * Returns everything needed for a comprehensive group dashboard:
 * - Savings trend (monthly)
 * - Loan portfolio distribution (by status)
 * - Cashbox flow (recent entries)
 * - Member leaderboard (top savers)
 * - Meeting attendance rate
 * - Full ledger book
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: groupId } = await params

    const group = await db.vslaGroupV2.findUnique({
      where: { id: groupId },
      include: {
        keyHolders: { where: { status: 'ACTIVE' } },
        cycles: { orderBy: { startDate: 'desc' }, take: 3 },
        _count: { select: { members: true, loans: true, meetings: true } },
      },
    })

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    // ─── 1. Savings trend (last 6 months) ───
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const savingsTransactions = await db.vslaTransactionV2.findMany({
      where: { groupId, type: 'SAVING', createdAt: { gte: sixMonthsAgo } },
      select: { amount: true, createdAt: true },
    })

    const monthlySavings: Array<{ month: string; amount: number }> = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthKey = d.toLocaleDateString('en', { month: 'short', year: '2-digit' })
      const monthAmount = savingsTransactions
        .filter(t => {
          const td = new Date(t.createdAt)
          return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear()
        })
        .reduce((sum, t) => sum + t.amount, 0)
      monthlySavings.push({ month: monthKey, amount: monthAmount })
    }

    // ─── 2. Loan portfolio distribution ───
    const loans = await db.vslaLoanV2.findMany({
      where: { groupId },
      select: { status: true, amount: true, outstanding: true },
    })

    const loanPortfolio: Record<string, { count: number; amount: number }> = {}
    for (const loan of loans) {
      if (!loanPortfolio[loan.status]) {
        loanPortfolio[loan.status] = { count: 0, amount: 0 }
      }
      loanPortfolio[loan.status].count++
      loanPortfolio[loan.status].amount += loan.amount
    }

    // ─── 3. Cashbox flow (last 20 entries) ───
    const cashboxEntries = await db.vslaCashboxEntryV2.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // ─── 4. Full ledger book (all transactions) ───
    const ledger = await db.vslaTransactionV2.findMany({
      where: { groupId },
      include: {
        member: { select: { fullName: true, memberId: true } },
        meeting: { select: { title: true, meetingDate: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // ─── 5. Member leaderboard (top savers) ───
    const topSavers = await db.vslaMemberV2.findMany({
      where: { groupId, status: 'ACTIVE' },
      select: { id: true, memberId: true, fullName: true, totalSavings: true, totalShares: true, phone: true },
      orderBy: { totalSavings: 'desc' },
      take: 10,
    })

    // ─── 6. Meeting attendance stats ───
    const meetings = await db.vslaMeetingV2.findMany({
      where: { groupId, status: 'CONCLUDED' },
      select: { attendanceCount: true, totalMembers: true, meetingDate: true, title: true },
      orderBy: { meetingDate: 'desc' },
      take: 10,
    })

    const avgAttendance = meetings.length > 0
      ? Math.round(meetings.reduce((sum, m) => sum + (m.totalMembers > 0 ? (m.attendanceCount / m.totalMembers) * 100 : 0), 0) / meetings.length)
      : 0

    // ─── 7. Summary stats ───
    const totalSavings = await db.vslaTransactionV2.aggregate({
      where: { groupId, type: 'SAVING', status: 'COMPLETED' },
      _sum: { amount: true },
    })
    const totalLoansDisbursed = await db.vslaLoanV2.aggregate({
      where: { groupId, status: { in: ['DISBURSED', 'REPAID', 'OVERDUE'] } },
      _sum: { amount: true },
    })
    const totalLoansOutstanding = await db.vslaLoanV2.aggregate({
      where: { groupId, status: { in: ['DISBURSED', 'OVERDUE'] } },
      _sum: { outstanding: true },
    })
    const totalFines = await db.vslaTransactionV2.aggregate({
      where: { groupId, type: 'FINE', status: 'COMPLETED' },
      _sum: { amount: true },
    })
    const totalWelfare = await db.vslaTransactionV2.aggregate({
      where: { groupId, type: 'WELFARE_CONTRIBUTION', status: 'COMPLETED' },
      _sum: { amount: true },
    })

    return NextResponse.json({
      group,
      charts: {
        monthlySavings,
        loanPortfolio: Object.entries(loanPortfolio).map(([status, data]) => ({
          name: status.replace(/_/g, ' '),
          count: data.count,
          amount: data.amount,
        })),
        cashboxFlow: cashboxEntries,
        attendanceTrend: meetings.map(m => ({
          date: m.meetingDate,
          title: m.title,
          attendance: m.totalMembers > 0 ? Math.round((m.attendanceCount / m.totalMembers) * 100) : 0,
          present: m.attendanceCount,
          total: m.totalMembers,
        })),
      },
      ledger: ledger.map(t => ({
        date: t.createdAt,
        type: t.type.replace(/_/g, ' '),
        direction: t.direction,
        amount: t.amount,
        description: t.description,
        reference: t.transactionRef,
        member: t.member?.fullName || '—',
        memberId: t.member?.memberId || '',
        meeting: t.meeting?.title || '',
        recordedBy: t.recordedByName || 'System',
        status: t.status,
      })),
      topSavers,
      stats: {
        totalMembers: group._count.members,
        totalKeyHolders: (group as any).keyHolders?.length || 0,
        totalLoans: group._count.loans,
        totalMeetings: group._count.meetings,
        totalSavings: totalSavings._sum.amount || 0,
        totalLoansDisbursed: totalLoansDisbursed._sum.amount || 0,
        totalLoansOutstanding: totalLoansOutstanding._sum.outstanding || 0,
        totalFines: totalFines._sum.amount || 0,
        totalWelfare: totalWelfare._sum.amount || 0,
        cashboxBalance: group.cashboxBalance,
        avgAttendance,
      },
    })
  } catch (error) {
    console.error('[vsla-v2/report GET] error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
