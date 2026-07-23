import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');
  const role = url.searchParams.get('role');
  const where: Record<string, unknown> = {};
  if (tenantId) where.tenantId = tenantId;
  if (role) where.role = role;

  const users = await db.user.findMany({
    where,
    include: { tenant: { select: { name: true, code: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ users });
}
