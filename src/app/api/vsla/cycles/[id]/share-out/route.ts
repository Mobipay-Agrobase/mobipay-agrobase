import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateShareOut, writeAuditLog } from '@/lib/vsla-engine';

// Share-out at end of cycle — uses per-group config for reserve % and interest split %
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cycle = await db.vslaCycle.findUnique({
    where: { id },
    include: { group: true },
  });
  if (!cycle) return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });

  const group = cycle.group;

  // Aggregate cycle totals
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

  // Use per-group config for share-out calculation
  const calc = calculateShareOut({
    totalShares,
    totalSavings,
    interestEarned: interestEarned._sum.amount ?? 0,
    finesCollected: finesCollected._sum.amount ?? 0,
    reservePercentage: group.reservePercentage,
    interestSplitPercentage: group.shareOutInterestSplit,
  });

  const updated = await db.vslaCycle.update({
    where: { id },
    data: {
      status: 'CLOSED',
      shareOutDate: new Date(),
      interestEarned: calc.interestEarned,
      finesCollected: calc.finesCollected,
      shareOutPerShare: calc.shareOutPerShare,
    },
  });

  await writeAuditLog({
    tenantId: group.tenantId,
    action: 'SHARE_OUT',
    entityType: 'VslaCycle',
    entityId: id,
    description: `Share-out for cycle "${cycle.name}". Per-share: ${calc.shareOutPerShare.toFixed(2)} UGX. Reserve: ${calc.reserveAmount.toFixed(2)} UGX (${group.reservePercentage}%). Interest split: ${group.shareOutInterestSplit}%.`,
    metadata: calc,
  });

  return NextResponse.json({
    cycle: updated,
    shareOut: calc,
  });
}
