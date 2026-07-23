import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const where: Record<string, unknown> = {};
  if (groupId) where.groupId = groupId;

  const officers = await db.vslaOfficerRoleV3.findMany({
    where,
    include: { member: { select: { fullName: true, memberId: true, phone: true } } },
    orderBy: { startDate: 'desc' },
  });
  return NextResponse.json({ officers });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { groupId, memberId, role, startDate } = body;

  if (!groupId || !memberId || !role) {
    return NextResponse.json({ error: 'groupId, memberId, role required' }, { status: 400 });
  }

  // End any existing active role of the same type
  await db.vslaOfficerRoleV3.updateMany({
    where: { groupId, role, status: 'ACTIVE' },
    data: { status: 'PAST', endDate: new Date() },
  });

  const officer = await db.vslaOfficerRoleV3.create({
    data: {
      groupId, memberId, role,
      startDate: startDate ? new Date(startDate) : new Date(),
      status: 'ACTIVE',
      electedAt: new Date(),
    },
  });
  return NextResponse.json({ officer }, { status: 201 });
}
