import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Refs, postJournalEntry, VSLA_TRANSACTION_TYPES, writeAuditLog } from '@/lib/vsla-engine';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const where: Record<string, unknown> = {};
  if (groupId) where.groupId = groupId;

  const contributions = await db.vslaSocialFundContribution.findMany({
    where,
    include: { member: { select: { fullName: true, memberId: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const total = await db.vslaSocialFundContribution.aggregate({
    where, _sum: { amount: true },
  });
  return NextResponse.json({ contributions, total: total._sum.amount ?? 0 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { groupId, memberId, amount, contributionType = 'REGULAR', paymentMethod = 'CASH', meetingId, notes } = body;

  if (!groupId || !amount) return NextResponse.json({ error: 'groupId, amount required' }, { status: 400 });

  const group = await db.vslaGroup.findUnique({ where: { id: groupId } });
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  const transactionRef = Refs.socialFundContribution();

  const contribution = await db.$transaction(async (tx) => {
    const c = await tx.vslaSocialFundContribution.create({
      data: { groupId, memberId, amount, contributionType, paymentMethod, transactionRef, meetingId, notes },
    });
    await tx.vslaTransaction.create({
      data: {
        groupId,
        type: VSLA_TRANSACTION_TYPES.SOCIAL_FUND_CONTRIBUTION,
        amount,
        transactionRef,
        refType: 'SOCIAL_FUND',
        refId: c.id,
        memberId,
        meetingId,
      },
    });
    return c;
  });

  await postJournalEntry({
    groupId,
    description: `Social fund contribution (${amount} UGX)`,
    refType: 'SOCIAL_FUND',
    refId: contribution.id,
    transactionId: transactionRef,
    lines: [
      { accountCode: paymentMethod === 'MOBILE_MONEY' ? '1100' : '1000', debit: amount },
      { accountCode: '2100', credit: amount },
    ],
  });

  await writeAuditLog({
    tenantId: group.tenantId,
    action: 'CREATE',
    entityType: 'VslaSocialFundContribution',
    entityId: contribution.id,
    description: `Social fund contribution ${amount} UGX`,
    metadata: { groupId, memberId, amount, contributionType },
  });

  return NextResponse.json({ contribution }, { status: 201 });
}
