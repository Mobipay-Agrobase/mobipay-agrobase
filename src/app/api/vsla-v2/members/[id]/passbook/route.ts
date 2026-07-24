/**
 * VSLA V2 — Member Passbook (Bank-style statement)
 * Shows chronological transaction history for a member, like a bank passbook.
 * Each entry shows: date, type, description, debit, credit, balance.
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

    const { id: memberId } = await params

    // Get member details
    const member = await db.vslaMemberV2.findUnique({
      where: { id: memberId },
      include: {
        group: { select: { name: true, code: true, sharePrice: true, tenantId: true } },
      },
    })

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    // Tenant isolation
    if (!ctx.isSuperAdmin && member.group && !ctx.tenantScope.includes(member.group.tenantId)) {
      // Need to check tenantId from the group
      const group = await db.vslaGroupV2.findUnique({ where: { id: member.groupId }, select: { tenantId: true } })
      if (!group || !ctx.tenantScope.includes(group.tenantId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get ALL transactions for this member (chronological order)
    const transactions = await db.vslaTransactionV2.findMany({
      where: { memberId },
      orderBy: { createdAt: 'asc' },
      take: 500,
    })

    // Get loan history
    const loans = await db.vslaLoanV2.findMany({
      where: { memberId },
      include: {
        approvals: { include: { keyHolder: { select: { fullName: true, role: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get meeting attendance
    const attendance = await db.vslaMeetingAttendanceV2.findMany({
      where: { memberId },
      include: { meeting: { select: { title: true, meetingDate: true, meetingNumber: true } } },
      orderBy: { createdAt: 'desc' },
    })

    // Build passbook entries with running balance
    let runningBalance = 0
    const passbookEntries = transactions.map(tx => {
      // IN = credit (savings increase), OUT = debit (savings decrease)
      if (tx.direction === 'IN' && tx.type === 'SAVING') {
        runningBalance += tx.amount
      } else if (tx.direction === 'OUT' && tx.type === 'SHARE_OUT') {
        runningBalance -= tx.amount
      }

      return {
        date: tx.createdAt,
        type: tx.type.replace(/_/g, ' '),
        description: tx.description || tx.type,
        reference: tx.transactionRef,
        debit: tx.direction === 'OUT' ? tx.amount : 0,
        credit: tx.direction === 'IN' ? tx.amount : 0,
        balance: runningBalance,
        recordedBy: tx.recordedByName || 'System',
      }
    })

    // Summary
    const totalSavings = transactions
      .filter(t => t.type === 'SAVING')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalLoansTaken = loans.reduce((sum, l) => sum + l.amount, 0)
    const totalLoansRepaid = loans.reduce((sum, l) => sum + l.amountRepaid, 0)
    const outstandingLoans = loans
      .filter(l => ['DISBURSED', 'OVERDUE'].includes(l.status))
      .reduce((sum, l) => sum + l.outstanding, 0)
    const meetingsAttended = attendance.filter(a => a.present).length
    const totalMeetings = attendance.length

    return NextResponse.json({
      member: {
        id: member.id,
        memberId: member.memberId,
        fullName: member.fullName,
        phone: member.phone,
        gender: member.gender,
        nationalId: member.nationalId,
        joinedAt: member.joinedAt,
        status: member.status,
        totalShares: member.totalShares,
        totalSavings: member.totalSavings,
        photoUrl: member.photoUrl,
        group: member.group,
      },
      passbook: passbookEntries.reverse(), // most recent first
      loans: loans.map(l => ({
        id: l.id,
        amount: l.amount,
        interestRate: l.interestRate,
        totalRepayable: l.totalRepayable,
        amountRepaid: l.amountRepaid,
        outstanding: l.outstanding,
        purpose: l.purpose,
        status: l.status,
        applicationDate: l.applicationDate,
        disbursedAt: l.disbursedAt,
        expectedRepaymentDate: l.expectedRepaymentDate,
        transactionRef: l.transactionRef,
        approvals: l.approvals,
      })),
      attendance: attendance.map(a => ({
        meetingTitle: a.meeting.title,
        meetingDate: a.meeting.meetingDate,
        meetingNumber: a.meeting.meetingNumber,
        present: a.present,
        arrivedLate: a.arrivedLate,
      })),
      summary: {
        totalSavings,
        totalShares: member.totalShares,
        shareValue: member.group?.sharePrice || 0,
        totalLoansTaken,
        totalLoansRepaid,
        outstandingLoans,
        meetingsAttended,
        totalMeetings,
        attendanceRate: totalMeetings > 0 ? Math.round((meetingsAttended / totalMeetings) * 100) : 0,
      },
    })
  } catch (error) {
    console.error('[vsla-v2/passbook GET] error:', error)
    return NextResponse.json({ error: 'Failed to fetch passbook' }, { status: 500 })
  }
}
