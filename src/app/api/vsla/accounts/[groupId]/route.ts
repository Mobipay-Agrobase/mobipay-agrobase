import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const accounts = await db.vslaAccount.findMany({
    where: { groupId },
    orderBy: { code: 'asc' },
    include: { _count: { select: { journalEntries: true } } },
  });

  const totalDebit = accounts.filter((a) => a.type === 'ASSET' || a.type === 'EXPENSE').reduce((s, a) => s + Math.max(0, a.balance), 0);
  const totalCredit = accounts.filter((a) => a.type === 'LIABILITY' || a.type === 'EQUITY' || a.type === 'INCOME').reduce((s, a) => s + Math.max(0, a.balance), 0);

  return NextResponse.json({
    accounts,
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
  });
}
