import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const status = url.searchParams.get('status');

  const where: Record<string, unknown> = {};
  if (groupId) where.groupId = groupId;
  if (status) where.status = status;

  const members = await db.vslaMember.findMany({
    where,
    include: {
      group: { select: { id: true, name: true, code: true } },
      officerRoles: { where: { status: 'ACTIVE' }, select: { role: true } },
      _count: { select: { savings: true, loans: true } },
    },
    orderBy: { joinedAt: 'desc' },
  });

  // Compute per-member savings
  const enriched = await Promise.all(
    members.map(async (m) => {
      const savings = await db.vslaSaving.aggregate({
        where: { memberId: m.id, status: 'COMPLETED' },
        _sum: { amount: true },
      });
      const shares = await db.vslaSaving.aggregate({
        where: { memberId: m.id, status: 'COMPLETED' },
        _sum: { sharesBought: true },
      });
      const outstandingLoans = await db.vslaLoan.aggregate({
        where: { memberId: m.id, status: { in: ['DISBURSED', 'OVERDUE'] } },
        _sum: { outstanding: true },
      });
      return {
        ...m,
        totalSavings: savings._sum.amount ?? 0,
        totalShares: shares._sum.sharesBought ?? 0,
        outstandingLoans: outstandingLoans._sum.outstanding ?? 0,
      };
    })
  );

  return NextResponse.json({ members: enriched });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    groupId, fullName, phone, email, nationalId, gender,
    dateOfBirth, occupation, nextOfKin, nextOfKinPhone,
  } = body;

  if (!groupId || !fullName) {
    return NextResponse.json({ error: 'groupId and fullName are required' }, { status: 400 });
  }

  const memberId = `MBR-${Date.now().toString(36).toUpperCase()}`;
  const member = await db.vslaMember.create({
    data: {
      groupId,
      fullName,
      phone,
      email,
      nationalId,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      occupation,
      nextOfKin,
      nextOfKinPhone,
      memberId,
      status: 'ACTIVE',
      joinedAt: new Date(),
    },
  });

  return NextResponse.json({ member }, { status: 201 });
}
