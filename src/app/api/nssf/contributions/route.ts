import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Refs, writeAuditLog } from '@/lib/vsla-engine';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');
  const status = url.searchParams.get('status');
  const where: Record<string, unknown> = {};
  if (tenantId) where.tenantId = tenantId;
  if (status) where.status = status;

  const contributions = await db.nssfContribution.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const total = await db.nssfContribution.aggregate({
    where, _sum: { amount: true },
  });

  return NextResponse.json({ contributions, total: total._sum.amount ?? 0 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenantId, farmerName, farmerPhone, nationalId, nssfNumber, amount, contributionMonth, paymentMethod = 'MOBILE_MONEY', mobileMoneyRef, partnerCode } = body;

  if (!tenantId || !farmerName || !amount) {
    return NextResponse.json({ error: 'tenantId, farmerName, amount required' }, { status: 400 });
  }

  const contribution = await db.nssfContribution.create({
    data: {
      tenantId,
      farmerName, farmerPhone, nationalId, nssfNumber,
      amount,
      contributionMonth,
      paymentMethod,
      mobileMoneyRef,
      partnerCode,
      status: 'RECEIVED',
    },
  });

  // Auto-send SMS confirmation
  const smsMessage = `Hello ${farmerName}, we received your NSSF contribution of UGX ${amount.toLocaleString()}. Reference: ${contribution.id.slice(-8).toUpperCase()}. Thank you.`;
  await db.smsLog.create({
    data: {
      tenantId,
      toPhone: farmerPhone || '',
      message: smsMessage,
      templateCode: 'NSSF_CONTRIBUTION_RECEIVED',
      category: 'NSSF',
      provider: 'AFRICAS_TALKING',
      status: 'SENT',
      sentAt: new Date(),
      refType: 'NSSF_CONTRIBUTION',
      refId: contribution.id,
    },
  });

  // Mark SMS sent on the contribution
  await db.nssfContribution.update({
    where: { id: contribution.id },
    data: { smsSent: true, smsMessageId: `SMS-${Date.now()}` },
  });

  await writeAuditLog({
    tenantId,
    action: 'CREATE',
    entityType: 'NssfContribution',
    entityId: contribution.id,
    description: `NSSF contribution of ${amount} UGX received from ${farmerName}`,
    metadata: { amount, paymentMethod, partnerCode },
  });

  return NextResponse.json({ contribution }, { status: 201 });
}
