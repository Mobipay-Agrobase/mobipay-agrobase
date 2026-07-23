import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const status = url.searchParams.get('status');
  const where: Record<string, unknown> = {};
  if (groupId) where.groupId = groupId;
  if (status) where.status = status;

  const claims = await db.vslaSocialFundClaimV3.findMany({
    where,
    include: { member: { select: { fullName: true, memberId: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ claims });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { groupId, memberId, amount, claimType, description, beneficiaryName, beneficiaryPhone } = body;

  if (!groupId || !memberId || !amount || !claimType || !description) {
    return NextResponse.json({ error: 'groupId, memberId, amount, claimType, description required' }, { status: 400 });
  }

  const group = await db.vslaGroupV3.findUnique({ where: { id: groupId } });
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  // Enforce per-group max claim
  if (group.socialFundMaxClaim > 0 && amount > group.socialFundMaxClaim) {
    return NextResponse.json({
      error: `Claim exceeds group cap. This group's max social fund claim is ${group.socialFundMaxClaim} UGX.`,
    }, { status: 400 });
  }

  // Check available social fund balance
  const [contrib, disbursed] = await Promise.all([
    db.vslaSocialFundContributionV3.aggregate({ where: { groupId }, _sum: { amount: true } }),
    db.vslaSocialFundClaimV3.aggregate({ where: { groupId, status: 'DISBURSED' }, _sum: { amount: true } }),
  ]);
  const available = (contrib._sum.amount ?? 0) - (disbursed._sum.amount ?? 0);
  if (amount > available) {
    return NextResponse.json({
      error: `Insufficient social fund balance. Available: ${available} UGX.`,
    }, { status: 400 });
  }

  const claim = await db.vslaSocialFundClaimV3.create({
    data: {
      groupId, memberId, amount, claimType, description,
      beneficiaryName, beneficiaryPhone,
      status: 'PENDING',
      transactionRef: `SFC-${Date.now()}`,
    },
  });
  return NextResponse.json({ claim }, { status: 201 });
}
