import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');
  const entityType = url.searchParams.get('entityType');
  const action = url.searchParams.get('action');
  const limit = parseInt(url.searchParams.get('limit') || '100');

  const where: Record<string, unknown> = {};
  if (tenantId) where.tenantId = tenantId;
  if (entityType) where.entityType = entityType;
  if (action) where.action = action;

  const logs = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return NextResponse.json({ logs });
}
