import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/revenue-split — list all revenue splits (Kilimo Trust agreement)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const partnerId = url.searchParams.get('partnerId');

  const where: Record<string, unknown> = {};
  if (partnerId) where.partnerId = partnerId;

  const splits = await db.revenueSplit.findMany({
    where,
    include: { partner: true },
    orderBy: { createdAt: 'desc' },
  });

  // Aggregate by streamType
  const summary = await db.revenueSplit.groupBy({
    by: ['streamType'],
    _sum: { grossAmount: true, partnerShare: true, mobipayShare: true },
    where,
  });

  return NextResponse.json({ splits, summary });
}

// POST /api/admin/revenue-split — create a revenue split (e.g. for a contribution)
// Body: { partnerId, streamType, grossAmount, partnerPct, mobipayPct, costDeduction, transactionRef }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { partnerId, streamType, grossAmount, partnerPct, mobipayPct, costDeduction = 0, transactionRef } = body;

  if (!partnerId || !streamType || !grossAmount || partnerPct === undefined || mobipayPct === undefined) {
    return NextResponse.json({ error: 'partnerId, streamType, grossAmount, partnerPct, mobipayPct required' }, { status: 400 });
  }

  const partnerShare = (grossAmount * partnerPct) / 100;
  const mobipayShare = (grossAmount * mobipayPct) / 100;
  const partnerNet = partnerShare - (costDeduction * partnerPct / 100);
  const mobipayNet = mobipayShare - (costDeduction * mobipayPct / 100);

  const split = await db.revenueSplit.create({
    data: {
      partnerId,
      streamType,
      transactionRef: transactionRef || `SPLIT-${Date.now()}`,
      grossAmount,
      partnerShare,
      mobipayShare,
      costDeduction,
      partnerNet,
      mobipayNet,
    },
  });

  return NextResponse.json({ split }, { status: 201 });
}
