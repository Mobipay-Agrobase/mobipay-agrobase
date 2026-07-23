import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { postJournalEntry, VSLA_TRANSACTION_TYPES, writeAuditLogV3 } from '@/lib/vsla-engine';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action, approvedByName = 'Chairperson', disbursementMethod = 'CASH', mobileMoneyRef, rejectionReason } = body;

  const claim = await db.vslaSocialFundClaimV3.findUnique({
    where: { id },
    include: { group: true, member: true },
  });
  if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });

  if (action === 'approve') {
    const updated = await db.vslaSocialFundClaimV3.update({
      where: { id },
      data: { status: 'APPROVED', approvedAt: new Date(), approvedById: approvedByName },
    });
    return NextResponse.json({ claim: updated });
  }

  if (action === 'reject') {
    const updated = await db.vslaSocialFundClaimV3.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
    return NextResponse.json({ claim: updated });
  }

  if (action === 'disburse') {
    const updated = await db.$transaction(async (tx) => {
      const c = await tx.vslaSocialFundClaim.update({
        where: { id },
        data: {
          status: 'DISBURSED',
          disbursedAt: new Date(),
          disbursementMethod,
          mobileMoneyRef,
        },
      });
      await tx.vslaTransaction.create({
        data: {
          groupId: claim.groupId,
          type: VSLA_TRANSACTION_TYPES.SOCIAL_FUND_CLAIM,
          amount: claim.amount,
          transactionRef: c.transactionRef,
          refType: 'SOCIAL_FUND_CLAIM',
          refId: c.id,
          memberId: claim.memberId,
        },
      });
      return c;
    });

    // Post double-entry: Debit Social Fund, Credit Cash/MoMo
    await postJournalEntry({
      groupId: claim.groupId,
      description: `Social fund claim disbursed to ${claim.member.fullName} (${claim.amount} UGX — ${claim.claimType})`,
      refType: 'SOCIAL_FUND_CLAIM',
      refId: id,
      transactionId: claim.transactionRef,
      lines: [
        { accountCode: '2100', debit: claim.amount },
        { accountCode: disbursementMethod === 'MOBILE_MONEY' ? '1100' : '1000', credit: claim.amount },
      ],
    });

    await writeAuditLogV3({
      tenantId: claim.group.tenantId,
      actorName: approvedByName,
      action: 'DISBURSE',
      entityType: 'VslaSocialFundClaim',
      entityId: id,
      description: `Social fund claim ${claim.amount} UGX disbursed for ${claim.claimType}`,
    });

    return NextResponse.json({ claim: updated });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
