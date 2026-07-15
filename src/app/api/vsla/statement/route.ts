/**
 * GET /api/vsla/statement?farmerId=X
 * Returns a member's VSLA statement: shares, savings, loans, welfare, fines.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get('farmerId')

    if (!farmerId) {
      return NextResponse.json({ error: 'farmerId is required' }, { status: 400 })
    }

    // Get member info
    const member = await db.vslaMember.findFirst({
      where: { farmerId },
      include: { vslaGroup: { select: { name: true, sharePrice: true, id: true } }, farmer: { select: { firstName: true, lastName: true } } },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Aggregate all data
    const [savings, loans, welfare, fines, transactions] = await Promise.all([
      db.vslaSaving.aggregate({
        where: { farmerId, vslaGroupId: member.vslaGroupId, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      db.vslaLoan.findMany({
        where: { farmerId, vslaGroupId: member.vslaGroupId },
        select: { id: true, amount: true, totalRepayable: true, amountRepaid: true, status: true, createdAt: true, dueDate: true },
      }),
      db.welfarePayment.aggregate({
        where: { farmerId, vslaGroupId: member.vslaGroupId },
        _sum: { amount: true },
        _count: true,
      }),
      db.vslaTransaction.aggregate({
        where: { vslaGroupId: member.vslaGroupId, type: 'FINE' },
        _sum: { amount: true },
        _count: true,
      }),
      db.vslaTransaction.findMany({
        where: { vslaGroupId: member.vslaGroupId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ])

    const totalSavings = savings._sum.amount || 0
    const totalBorrowed = loans.reduce((s, l) => s + l.amount, 0)
    const totalRepaid = loans.reduce((s, l) => s + l.amountRepaid, 0)
    const outstandingLoans = loans
      .filter(l => l.status === 'DISBURSED' || l.status === 'OVERDUE')
      .reduce((s, l) => s + (l.totalRepayable - l.amountRepaid), 0)
    const totalWelfare = welfare._sum.amount || 0
    const totalFines = fines._sum.amount || 0

    return NextResponse.json({
      member: {
        memberId: member.memberId,
        name: `${member.farmer?.firstName || ''} ${member.farmer?.lastName || ''}`.trim(),
        groupName: member.vslaGroup.name,
        sharesOwned: member.sharesOwned,
        shareValue: member.vslaGroup.sharePrice,
      },
      summary: {
        totalSavings,
        totalBorrowed,
        totalRepaid,
        outstandingLoans,
        totalWelfare,
        totalFines,
        shareValue: member.sharesOwned * member.vslaGroup.sharePrice,
      },
      loans: loans.map(l => ({
        id: l.id,
        amount: l.amount,
        totalRepayable: l.totalRepayable,
        amountRepaid: l.amountRepaid,
        balance: l.totalRepayable - l.amountRepaid,
        status: l.status,
        date: l.createdAt,
        dueDate: l.dueDate,
      })),
      recentTransactions: transactions.map(t => ({
        type: t.type,
        walletType: t.walletType,
        amount: t.amount,
        description: t.description,
        date: t.createdAt,
      })),
    })
  } catch (error: any) {
    console.error('[vsla/statement] error:', error)
    return NextResponse.json({ error: 'Failed to load statement' }, { status: 500 })
  }
}
