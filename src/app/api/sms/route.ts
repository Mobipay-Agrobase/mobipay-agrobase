import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const status = url.searchParams.get('status');
  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (status) where.status = status;

  const logs = await db.smsLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const stats = {
    total: await db.smsLog.count(),
    sent: await db.smsLog.count({ where: { status: { in: ['SENT', 'DELIVERED'] } } }),
    pending: await db.smsLog.count({ where: { status: 'PENDING' } }),
    failed: await db.smsLog.count({ where: { status: 'FAILED' } }),
    byCategory: await db.smsLog.groupBy({
      by: ['category'],
      _count: { id: true },
    }),
  };

  return NextResponse.json({ logs, stats });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenantId, toPhone, message, templateCode, category, refType, refId } = body;

  if (!toPhone || !message) {
    return NextResponse.json({ error: 'toPhone, message required' }, { status: 400 });
  }

  const log = await db.smsLog.create({
    data: {
      tenantId,
      toPhone,
      message,
      templateCode,
      category,
      provider: 'AFRICAS_TALKING',
      status: 'SENT',
      sentAt: new Date(),
      refType, refId,
    },
  });

  return NextResponse.json({ log }, { status: 201 });
}
