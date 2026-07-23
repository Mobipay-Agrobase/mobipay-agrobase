import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Refs } from '@/lib/vsla-engine';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');
  const status = url.searchParams.get('status');
  const where: Record<string, unknown> = {};
  if (tenantId) where.tenantId = tenantId;
  if (status) where.status = status;

  const payments = await db.payment.findMany({
    where,
    include: { tenant: { select: { name: true, code: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const total = await db.payment.aggregate({
    where, _sum: { amount: true },
  });
  return NextResponse.json({ payments, total: total._sum.amount ?? 0 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenantId, payerPhone, payerName, amount, provider, type, refType, refId } = body;

  if (!tenantId || !payerPhone || !amount || !provider || !type) {
    return NextResponse.json({ error: 'tenantId, payerPhone, amount, provider, type required' }, { status: 400 });
  }

  const payment = await db.payment.create({
    data: {
      tenantId,
      reference: Refs.payment(),
      payerPhone, payerName, amount,
      provider, type,
      status: 'PENDING',
      refType, refId,
    },
  });
  return NextResponse.json({ payment }, { status: 201 });
}
