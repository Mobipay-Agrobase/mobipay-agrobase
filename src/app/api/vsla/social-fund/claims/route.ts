import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const status = url.searchParams.get('status');
  const where: Record<string, unknown> = {};
  if (groupId) where.groupId = groupId;
  if (status) where.status = status;

  const claims = await db.vslaSocialFundClaim.findMany({
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

  const claim = await db.vslaSocialFundClaim.create({
    data: {
      groupId, memberId, amount, claimType, description,
      beneficiaryName, beneficiaryPhone,
      status: 'PENDING',
      transactionRef: `SFC-${Date.now()}`,
    },
  });
  return NextResponse.json({ claim }, { status: 201 });
}
