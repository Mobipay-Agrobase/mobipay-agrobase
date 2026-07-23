import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const sessions = await db.ussdSession.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const stats = {
    total: await db.ussdSession.count(),
    active: await db.ussdSession.count({ where: { status: 'ACTIVE' } }),
    completed: await db.ussdSession.count({ where: { status: 'COMPLETED' } }),
    timedOut: await db.ussdSession.count({ where: { status: 'TIMED_OUT' } }),
    byMenu: await db.ussdSession.groupBy({
      by: ['currentMenu'],
      _count: { id: true },
    }),
  };

  return NextResponse.json({ sessions, stats });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, phoneNumber, serviceCode, text, currentMenu, tenantId, farmerId, vslaGroupId, status = 'COMPLETED', duration } = body;

  if (!sessionId || !phoneNumber) {
    return NextResponse.json({ error: 'sessionId, phoneNumber required' }, { status: 400 });
  }

  const session = await db.ussdSession.create({
    data: {
      sessionId, phoneNumber, serviceCode,
      text: text || '',
      currentMenu: currentMenu || 'ROOT',
      tenantId, farmerId, vslaGroupId,
      status,
      duration: duration || 0,
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}
