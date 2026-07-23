import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const settlements = await db.partnerSettlement.findMany({
    where: { partnerId: id },
    orderBy: { period: 'desc' },
  });

  // Aggregate by streamType
  const summary = await db.partnerSettlement.groupBy({
    by: ['streamType'],
    _sum: { grossAmount: true, partnerShare: true, mobipayShare: true },
    where: { partnerId: id },
  });

  return NextResponse.json({ settlements, summary });
}
