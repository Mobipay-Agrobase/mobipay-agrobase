import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureGroupAccounts, writeAuditLogV3, VSLA_GROUP_STATUS } from '@/lib/vsla-engine';

// GET /api/vsla/groups — list all groups with stats (FIXED: totalSavings was hardcoded to 0)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');

  const where = tenantId ? { tenantId } : {};
  const groups = await db.vslaGroupV3.findMany({
    where,
    include: {
      _count: {
        select: { members: true, loans: true, savings: true, meetings: true },
      },
      members: { where: { status: 'ACTIVE' }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Compute real savings totals per group
  const enriched = await Promise.all(
    groups.map(async (g) => {
      const savingsAgg = await db.vslaSavingV3.aggregate({
        where: { groupId: g.id, status: 'COMPLETED' },
        _sum: { amount: true },
      });
      const loansOutstanding = await db.vslaLoanV3.aggregate({
        where: { groupId: g.id, status: { in: ['DISBURSED', 'OVERDUE'] } },
        _sum: { outstanding: true },
      });
      const socialContrib = await db.vslaSocialFundContributionV3.aggregate({
        where: { groupId: g.id },
        _sum: { amount: true },
      });
      const socialClaims = await db.vslaSocialFundClaimV3.aggregate({
        where: { groupId: g.id, status: 'DISBURSED' },
        _sum: { amount: true },
      });
      return {
        ...g,
        totalSavings: savingsAgg._sum.amount ?? 0,
        outstandingLoans: loansOutstanding._sum.outstanding ?? 0,
        socialFundBalance: (socialContrib._sum.amount ?? 0) - (socialClaims._sum.amount ?? 0),
      };
    })
  );

  return NextResponse.json({ groups: enriched });
}

// POST /api/vsla/groups — create a new VSLA group
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    tenantId, name, region, district, description,
    shareValue = 5000, loanInterestRate = 10, maxLoanMultiplier = 3,
    meetingFrequency = 'WEEKLY', meetingDay, welfareContribution = 0,
    formedAt,
  } = body;

  if (!tenantId || !name) {
    return NextResponse.json({ error: 'tenantId and name are required' }, { status: 400 });
  }

  const code = `VSLA-${Date.now().toString(36).toUpperCase()}`;

  const group = await db.vslaGroupV3.create({
    data: {
      tenantId,
      name,
      code,
      region,
      district,
      description,
      shareValue,
      loanInterestRate,
      maxLoanMultiplier,
      meetingFrequency,
      meetingDay,
      welfareContribution,
      formedAt: formedAt ? new Date(formedAt) : new Date(),
      status: VSLA_GROUP_STATUS.ACTIVE,
    },
  });

  // Initialize chart of accounts for this group
  await ensureGroupAccounts(group.id);

  await writeAuditLogV3({
    tenantId,
    action: 'CREATE',
    entityType: 'VslaGroup',
    entityId: group.id,
    description: `Created VSLA group "${name}" (${code})`,
    metadata: { shareValue, loanInterestRate, meetingFrequency },
  });

  return NextResponse.json({ group }, { status: 201 });
}
