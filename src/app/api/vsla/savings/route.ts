import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateShares, Refs, postJournalEntry, VSLA_TRANSACTION_TYPES, writeAuditLog } from '@/lib/vsla-engine';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const memberId = url.searchParams.get('memberId');
  const limit = parseInt(url.searchParams.get('limit') || '100');

  const where: Record<string, unknown> = {};
  if (groupId) where.groupId = groupId;
  if (memberId) where.memberId = memberId;

  const savings = await db.vslaSaving.findMany({
    where,
    include: {
      member: { select: { id: true, fullName: true, memberId: true } },
      group: { select: { id: true, name: true, code: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const total = await db.vslaSaving.aggregate({
    where,
    _sum: { amount: true, sharesBought: true },
  });

  return NextResponse.json({
    savings,
    totalAmount: total._sum.amount ?? 0,
    totalShares: total._sum.sharesBought ?? 0,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { groupId, memberId, amount, paymentMethod = 'CASH', mobileMoneyRef, meetingId, notes, recordedById, savedOnBehalfOf, recordedByName = 'System' } = body;

  if (!groupId || !memberId || !amount || amount <= 0) {
    return NextResponse.json({ error: 'groupId, memberId, and a positive amount are required' }, { status: 400 });
  }

  const group = await db.vslaGroup.findUnique({ where: { id: groupId } });
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  // Enforce per-group savings limits
  if (group.minSavingsPerMeeting > 0 && amount < group.minSavingsPerMeeting) {
    return NextResponse.json({
      error: `Amount below group minimum. This group requires at least ${group.minSavingsPerMeeting} UGX per meeting.`,
    }, { status: 400 });
  }
  if (group.maxSavingsPerMeeting > 0 && amount > group.maxSavingsPerMeeting) {
    return NextResponse.json({
      error: `Amount exceeds group cap. This group allows max ${group.maxSavingsPerMeeting} UGX per meeting.`,
    }, { status: 400 });
  }

  // FIXED: Use group.shareValue (was inconsistent /1000 vs /5000)
  const sharesBought = calculateShares(amount, group.shareValue);
  const transactionRef = Refs.saving();

  // Run in transaction
  const saving = await db.$transaction(async (tx) => {
    const s = await tx.vslaSaving.create({
      data: {
        groupId,
        memberId,
        amount,
        sharesBought,
        paymentMethod,
        mobileMoneyRef,
        transactionRef,
        meetingId,
        notes,
        savedOnBehalfOf,
        status: 'COMPLETED',
      },
    });

    // Write master ledger transaction
    await tx.vslaTransaction.create({
      data: {
        groupId,
        type: VSLA_TRANSACTION_TYPES.SAVING,
        amount,
        transactionRef,
        refType: 'SAVING',
        refId: s.id,
        memberId,
        meetingId,
      },
    });

    return s;
  });

  // Post double-entry: Debit Cash/MoMo, Credit Members Savings
  await postJournalEntry({
    groupId,
    description: `Savings deposit by member (${amount} UGX, ${sharesBought} shares)`,
    refType: 'SAVING',
    refId: saving.id,
    transactionId: transactionRef,
    lines: [
      { accountCode: paymentMethod === 'MOBILE_MONEY' ? '1100' : '1000', debit: amount },
      { accountCode: '2000', credit: amount },
    ],
  });

  await writeAuditLog({
    tenantId: group.tenantId,
    actorName: recordedByName,
    action: 'CREATE',
    entityType: 'VslaSaving',
    entityId: saving.id,
    description: `Savings deposit ${amount} UGX (${sharesBought} shares) by ${savedOnBehalfOf || 'self'}`,
    metadata: { groupId, memberId, amount, sharesBought, paymentMethod },
  });

  return NextResponse.json({ saving }, { status: 201 });
}
