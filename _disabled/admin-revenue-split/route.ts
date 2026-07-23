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

// POST /api/admin/revenue-split — create a revenue split per Kilimo Trust MoU
// Body: { partnerId, streamType, grossAmount, partnerPct, mobipayPct, costDeduction, transactionRef, costAllocation }
//
// costAllocation controls how MNO/USSD costs are deducted:
//   - 'MOBIPAY_ABSORBS' (DEFAULT per MoU): MobiPay's 70% transaction fee share absorbs ALL costs.
//     Per Eric's MoU wording: "MobiPay: 70% - Covers system, USSD, and payment processing"
//   - 'PROPORTIONAL': costs split proportionally across both parties (net interpretation)
//   - 'PARTNER_ABSORBS': partner absorbs all costs (uncommon, used if KT ever takes cost risk)
//
// For commission (55/45) and float (55/45) streams, costDeduction is typically 0
// because KT holds the OVA and float risk is transferred to KT per the MoU.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    partnerId, streamType, grossAmount, partnerPct, mobipayPct,
    costDeduction = 0, transactionRef,
    costAllocation = 'MOBIPAY_ABSORBS',
  } = body;

  if (!partnerId || !streamType || !grossAmount || partnerPct === undefined || mobipayPct === undefined) {
    return NextResponse.json({ error: 'partnerId, streamType, grossAmount, partnerPct, mobipayPct required' }, { status: 400 });
  }

  const partnerShare = (grossAmount * partnerPct) / 100;
  const mobipayShare = (grossAmount * mobipayPct) / 100;

  // Apply cost allocation per the agreement
  let partnerNet: number;
  let mobipayNet: number;
  switch (costAllocation) {
    case 'PROPORTIONAL':
      // Costs split proportionally across both parties
      partnerNet = partnerShare - (costDeduction * partnerPct / 100);
      mobipayNet = mobipayShare - (costDeduction * mobipayPct / 100);
      break;
    case 'PARTNER_ABSORBS':
      // Partner absorbs all costs
      partnerNet = partnerShare - costDeduction;
      mobipayNet = mobipayShare;
      break;
    case 'MOBIPAY_ABSORBS':
    default:
      // DEFAULT per Kilimo Trust MoU — MobiPay's 70% absorbs all MNO/USSD costs
      partnerNet = partnerShare;
      mobipayNet = mobipayShare - costDeduction;
      break;
  }

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

  return NextResponse.json({ split, costAllocation }, { status: 201 });
}
