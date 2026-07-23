import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getGroupStats, getAgingBucket } from '@/lib/vsla-engine';

// Comprehensive group report — trial balance, P&L, loan portfolio, aging
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [group, stats, accounts, savings, loans, meetings, transactions] = await Promise.all([
    db.vslaGroup.findUnique({
      where: { id },
      include: {
        members: { where: { status: 'ACTIVE' }, orderBy: { joinedAt: 'asc' } },
        cycles: { orderBy: { startDate: 'desc' } },
        officerRoles: { where: { status: 'ACTIVE' }, include: { member: true } },
      },
    }),
    getGroupStats(id),
    db.vslaAccount.findMany({ where: { groupId: id }, orderBy: { code: 'asc' } }),
    db.vslaSaving.findMany({
      where: { groupId: id },
      include: { member: { select: { fullName: true, memberId: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.vslaLoan.findMany({
      where: { groupId: id },
      include: {
        member: { select: { fullName: true, memberId: true } },
        repayments: true,
        guarantors: { include: { member: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.vslaMeeting.findMany({
      where: { groupId: id },
      orderBy: { meetingDate: 'desc' },
      take: 20,
      include: { _count: { select: { attendance: true } } },
    }),
    db.vslaTransaction.findMany({
      where: { groupId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  // Loan portfolio summary
  const portfolio = {
    total: loans.length,
    active: loans.filter((l) => ['DISBURSED', 'OVERDUE'].includes(l.status)).length,
    disbursedAmount: loans.filter((l) => ['DISBURSED', 'REPAID', 'OVERDUE', 'WRITTEN_OFF'].includes(l.status)).reduce((s, l) => s + l.amount, 0),
    outstandingAmount: loans.filter((l) => ['DISBURSED', 'OVERDUE'].includes(l.status)).reduce((s, l) => s + l.outstanding, 0),
    repaidAmount: loans.reduce((s, l) => s + l.amountRepaid, 0),
    writtenOff: loans.filter((l) => l.status === 'WRITTEN_OFF').length,
    defaulted: loans.filter((l) => l.status === 'DEFAULTED').length,
  };

  // Aging buckets
  const aging = loans
    .filter((l) => ['DISBURSED', 'OVERDUE'].includes(l.status) && l.expectedRepaymentDate)
    .reduce((acc, l) => {
      const bucket = getAgingBucket(l.expectedRepaymentDate!);
      acc[bucket] = (acc[bucket] || 0) + l.outstanding;
      return acc;
    }, {} as Record<string, number>);

  // Member statements
  const memberStatements = await Promise.all(
    group.members.map(async (m) => {
      const memberSavings = savings.filter((s) => s.memberId === m.id).reduce((sum, s) => sum + s.amount, 0);
      const memberShares = savings.filter((s) => s.memberId === m.id).reduce((sum, s) => sum + s.sharesBought, 0);
      const memberLoans = loans.filter((l) => l.memberId === m.id);
      const memberOutstanding = memberLoans.filter((l) => ['DISBURSED', 'OVERDUE'].includes(l.status)).reduce((s, l) => s + l.outstanding, 0);
      return {
        memberId: m.memberId,
        name: m.fullName,
        totalSavings: memberSavings,
        totalShares: memberShares,
        activeLoans: memberLoans.filter((l) => ['DISBURSED', 'OVERDUE'].includes(l.status)).length,
        outstandingLoans: memberOutstanding,
        joinedAt: m.joinedAt,
      };
    })
  );

  // Trial balance (group accounts)
  const trialBalance = accounts.map((a) => ({
    code: a.code,
    name: a.name,
    type: a.type,
    balance: a.balance,
    debit: (a.type === 'ASSET' || a.type === 'EXPENSE') && a.balance > 0 ? a.balance : 0,
    credit: (a.type === 'LIABILITY' || a.type === 'EQUITY' || a.type === 'INCOME') && a.balance > 0 ? a.balance : 0,
  }));

  const totalDebit = trialBalance.reduce((s, t) => s + t.debit, 0);
  const totalCredit = trialBalance.reduce((s, t) => s + t.credit, 0);

  return NextResponse.json({
    group,
    stats,
    portfolio,
    aging,
    memberStatements,
    trialBalance: { accounts: trialBalance, totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 },
    recentTransactions: transactions.slice(0, 50),
    recentMeetings: meetings,
    recentSavings: savings.slice(0, 50),
    loans,
  });
}
