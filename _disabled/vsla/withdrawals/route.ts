import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateShares, Refs, postJournalEntry, VSLA_TRANSACTION_TYPES, writeAuditLogV3 } from '@/lib/vsla-engine';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const where: Record<string, unknown> = {};
  if (groupId) where.groupId = groupId;

  const withdrawals = await db.vslaSavingWithdrawalV3.findMany({
    where,
    include: { member: { select: { fullName: true, memberId: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ withdrawals });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { groupId, memberId, amount, reason, paymentMethod = 'CASH', mobileMoneyRef, approvedById, approvedByName = 'Treasurer' } = body;

  if (!groupId || !memberId || !amount) {
    return NextResponse.json({ error: 'groupId, memberId, amount required' }, { status: 400 });
  }

  const group = await db.vslaGroupV3.findUnique({ where: { id: groupId } });
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  // Check member has enough savings
  const memberSavings = await db.vslaSavingV3.aggregate({
    where: { memberId, status: 'COMPLETED' },
    _sum: { amount: true },
  });
  const memberWithdrawals = await db.vslaSavingWithdrawalV3.aggregate({
    where: { memberId, status: { in: ['COMPLETED', 'APPROVED'] } },
    _sum: { amount: true },
  });
  const available = (memberSavings._sum.amount ?? 0) - (memberWithdrawals._sum.amount ?? 0);

  if (amount > available) {
    return NextResponse.json({ error: `Insufficient savings. Available: ${available}` }, { status: 400 });
  }

  const sharesRedeemed = calculateShares(amount, group.shareValue);
  const transactionRef = Refs.withdrawal();

  const withdrawal = await db.$transaction(async (tx) => {
    const w = await tx.vslaSavingWithdrawal.create({
      data: {
        groupId, memberId, amount, sharesRedeemed, reason,
        paymentMethod, mobileMoneyRef, transactionRef,
        status: 'COMPLETED',
        approvedById, approvedAt: new Date(),
      },
    });
    await tx.vslaTransaction.create({
      data: {
        groupId,
        type: VSLA_TRANSACTION_TYPES.WITHDRAWAL,
        amount,
        transactionRef,
        refType: 'WITHDRAWAL',
        refId: w.id,
        memberId,
      },
    });
    return w;
  });

  // Post double-entry: Debit Members Savings, Credit Cash/MoMo
  await postJournalEntry({
    groupId,
    description: `Savings withdrawal by member (${amount} UGX)`,
    refType: 'WITHDRAWAL',
    refId: withdrawal.id,
    transactionId: transactionRef,
    lines: [
      { accountCode: '2000', debit: amount },
      { accountCode: paymentMethod === 'MOBILE_MONEY' ? '1100' : '1000', credit: amount },
    ],
  });

  await writeAuditLogV3({
    tenantId: group.tenantId,
    actorName: approvedByName,
    action: 'CREATE',
    entityType: 'VslaSavingWithdrawal',
    entityId: withdrawal.id,
    description: `Savings withdrawal ${amount} UGX`,
    metadata: { groupId, memberId, amount, sharesRedeemed },
  });

  return NextResponse.json({ withdrawal }, { status: 201 });
}
