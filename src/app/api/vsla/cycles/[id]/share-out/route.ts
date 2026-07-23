import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateShareValue, writeAuditLog } from '@/lib/vsla-engine';

// Share-out at end of cycle — distribute the group's accumulated value proportionally to shares
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cycle = await db.vslaCycle.findUnique({
    where: { id },
    include: { group: true },
  });
  if (!cycle) return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });

  // Total value = savings + interest earned + fines - written-off loans
  const totalSavingsAgg = await db.vslaSaving.aggregate({
    where: { groupId: cycle.groupId, status: 'COMPLETED', createdAt: { gte: cycle.startDate, lte: cycle.endDate } },
    _sum: { amount: true, sharesBought: true },
  });
  const totalShares = totalSavingsAgg._sum.sharesBought ?? 0;
  const totalSavings = totalSavingsAgg._sum.amount ?? 0;

  const interestEarned = await db.vslaLoanRepayment.aggregate({
    where: { loan: { groupId: cycle.groupId }, createdAt: { gte: cycle.startDate, lte: cycle.endDate } },
    _sum: { amount: true },
  });

  const finesCollected = await db.vslaFine.aggregate({
    where: { groupId: cycle.groupId, status: 'PAID', paidAt: { gte: cycle.startDate, lte: cycle.endDate } },
    _sum: { amount: true },
  });

  const totalValue = totalSavings + (interestEarned._sum.amount ?? 0) + (finesCollected._sum.amount ?? 0);
  const shareOutPerShare = totalShares > 0 ? totalValue / totalShares : 0;

  const updated = await db.vslaCycle.update({
    where: { id },
    data: {
      status: 'CLOSED',
      shareOutDate: new Date(),
      interestEarned: interestEarned._sum.amount ?? 0,
      finesCollected: finesCollected._sum.amount ?? 0,
      shareOutPerShare,
    },
  });

  await writeAuditLog({
    tenantId: cycle.group.tenantId,
    action: 'SHARE_OUT',
    entityType: 'VslaCycle',
    entityId: id,
    description: `Share-out for cycle "${cycle.name}". Per-share: ${shareOutPerShare.toFixed(2)} UGX`,
    metadata: { totalShares, totalSavings, totalValue, shareOutPerShare },
  });

  return NextResponse.json({
    cycle: updated,
    shareOut: {
      totalShares,
      totalSavings,
      interestEarned: interestEarned._sum.amount ?? 0,
      finesCollected: finesCollected._sum.amount ?? 0,
      totalValue,
      shareOutPerShare,
    },
  });
}
