import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAgingBucket } from '@/lib/vsla-engine';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const where: Record<string, unknown> = { status: { in: ['DISBURSED', 'OVERDUE'] } };
  if (groupId) where.groupId = groupId;

  const loans = await db.vslaLoanV3.findMany({
    where,
    include: {
      member: { select: { fullName: true, memberId: true, phone: true } },
      group: { select: { name: true, code: true } },
    },
  });

  const buckets: Record<string, Array<{ loan: typeof loans[0]; daysOverdue: number }>> = {
    CURRENT: [],
    '1-30': [],
    '31-60': [],
    '61-90': [],
    '91-180': [],
    '180+': [],
  };

  const now = new Date();
  for (const loan of loans) {
    if (!loan.expectedRepaymentDate) continue;
    const bucket = getAgingBucket(loan.expectedRepaymentDate, now);
    const daysOverdue = Math.floor((now.getTime() - loan.expectedRepaymentDate.getTime()) / (1000 * 60 * 60 * 24));
    buckets[bucket].push({ loan, daysOverdue: Math.max(0, daysOverdue) });
  }

  const summary = Object.fromEntries(
    Object.entries(buckets).map(([k, v]) => [k, { count: v.length, amount: v.reduce((s, x) => s + x.loan.outstanding, 0) }])
  );

  return NextResponse.json({ buckets, summary, totalOutstanding: loans.reduce((s, l) => s + l.outstanding, 0) });
}
