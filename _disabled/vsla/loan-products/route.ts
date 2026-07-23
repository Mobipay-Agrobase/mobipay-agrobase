import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const where: Record<string, unknown> = {};
  if (groupId) where.groupId = groupId;

  const products = await db.vslaLoanProductV3.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { groupId, name, code, interestRate, minAmount = 0, maxAmount = 200000, termDays = 90, gracePeriodDays = 0, guarantorCount = 2 } = body;

  if (!groupId || !name || !code || interestRate === undefined) {
    return NextResponse.json({ error: 'groupId, name, code, interestRate required' }, { status: 400 });
  }

  const product = await db.vslaLoanProductV3.create({
    data: {
      groupId, name, code, interestRate, minAmount, maxAmount,
      termDays, gracePeriodDays, guarantorCount, isActive: true,
    },
  });
  return NextResponse.json({ product }, { status: 201 });
}
