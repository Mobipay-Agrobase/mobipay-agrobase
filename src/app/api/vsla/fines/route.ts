import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Refs, postJournalEntry, VSLA_TRANSACTION_TYPES, writeAuditLog } from '@/lib/vsla-engine';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const status = url.searchParams.get('status');
  const where: Record<string, unknown> = {};
  if (groupId) where.groupId = groupId;
  if (status) where.status = status;

  const fines = await db.vslaFine.findMany({
    where,
    include: { member: { select: { fullName: true, memberId: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ fines });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { groupId, memberId, amount, fineType, description, meetingId } = body;

  if (!groupId || !amount || !fineType) {
    return NextResponse.json({ error: 'groupId, amount, fineType required' }, { status: 400 });
  }

  const group = await db.vslaGroup.findUnique({ where: { id: groupId } });
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  const transactionRef = Refs.fine();
  const fine = await db.vslaFine.create({
    data: {
      groupId, memberId, amount, fineType, description, meetingId,
      status: 'OUTSTANDING',
      transactionRef,
    },
  });

  await writeAuditLog({
    tenantId: group.tenantId,
    action: 'CREATE',
    entityType: 'VslaFine',
    entityId: fine.id,
    description: `Fine ${amount} UGX (${fineType}) — ${description || 'no description'}`,
    metadata: { groupId, memberId, amount, fineType },
  });

  return NextResponse.json({ fine }, { status: 201 });
}

// PATCH — pay or waive a fine
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { fineId, action, paymentMethod = 'CASH' } = body;

  const fine = await db.vslaFine.findUnique({ where: { id: fineId }, include: { group: true } });
  if (!fine) return NextResponse.json({ error: 'Fine not found' }, { status: 404 });

  if (action === 'pay') {
    const updated = await db.$transaction(async (tx) => {
      const f = await tx.vslaFine.update({
        where: { id: fineId },
        data: { status: 'PAID', paidAt: new Date(), paymentMethod },
      });
      await tx.vslaTransaction.create({
        data: {
          groupId: fine.groupId,
          type: VSLA_TRANSACTION_TYPES.FINE,
          amount: fine.amount,
          transactionRef: fine.transactionRef,
          refType: 'FINE',
          refId: f.id,
          memberId: fine.memberId,
        },
      });
      return f;
    });

    await postJournalEntry({
      groupId: fine.groupId,
      description: `Fine paid (${fine.amount} UGX — ${fine.fineType})`,
      refType: 'FINE',
      refId: fineId,
      transactionId: fine.transactionRef,
      lines: [
        { accountCode: paymentMethod === 'MOBILE_MONEY' ? '1100' : '1000', debit: fine.amount },
        { accountCode: '4100', credit: fine.amount },
      ],
    });

    return NextResponse.json({ fine: updated });
  }

  if (action === 'waive') {
    const updated = await db.vslaFine.update({
      where: { id: fineId },
      data: { status: 'WAIVED' },
    });
    return NextResponse.json({ fine: updated });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
