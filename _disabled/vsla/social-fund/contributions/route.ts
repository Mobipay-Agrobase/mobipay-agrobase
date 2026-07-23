import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Refs, postJournalEntry, VSLA_TRANSACTION_TYPES, writeAuditLogV3 } from '@/lib/vsla-engine';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const where: Record<string, unknown> = {};
  if (groupId) where.groupId = groupId;

  const contributions = await db.vslaSocialFundContributionV3.findMany({
    where,
    include: { member: { select: { fullName: true, memberId: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const total = await db.vslaSocialFundContributionV3.aggregate({
    where, _sum: { amount: true },
  });
  return NextResponse.json({ contributions, total: total._sum.amount ?? 0 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { groupId, memberId, amount: amountRaw, contributionType = 'REGULAR', paymentMethod = 'CASH', meetingId, notes, useGroupDefault = false } = body;

  if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 });

  const group = await db.vslaGroupV3.findUnique({ where: { id: groupId } });
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  // If useGroupDefault is true OR no amount provided, use the group's welfare contribution default
  const amount = amountRaw ?? (useGroupDefault ? group.welfareContribution : 0);
  if (!amount || amount <= 0) {
    return NextResponse.json({
      error: `Amount required. This group's default welfare contribution is ${group.welfareContribution} UGX.`,
    }, { status: 400 });
  }

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

  await writeAuditLogV3({
    tenantId: group.tenantId,
    action: 'CREATE',
    entityType: 'VslaSocialFundContribution',
    entityId: contribution.id,
    description: `Social fund contribution ${amount} UGX`,
    metadata: { groupId, memberId, amount, contributionType },
  });

  return NextResponse.json({ contribution }, { status: 201 });
}
