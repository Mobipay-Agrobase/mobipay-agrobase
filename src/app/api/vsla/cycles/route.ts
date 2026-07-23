import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const where: Record<string, unknown> = {};
  if (groupId) where.groupId = groupId;

  const cycles = await db.vslaCycle.findMany({
    where,
    include: { group: { select: { name: true, code: true } } },
    orderBy: { startDate: 'desc' },
  });
  return NextResponse.json({ cycles });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { groupId, name, startDate, endDate, targetSavings = 0 } = body;

  if (!groupId || !name || !startDate || !endDate) {
    return NextResponse.json({ error: 'groupId, name, startDate, endDate required' }, { status: 400 });
  }

  const cycle = await db.vslaCycle.create({
    data: {
      groupId, name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      targetSavings,
      status: 'ACTIVE',
    },
  });
  return NextResponse.json({ cycle }, { status: 201 });
}
