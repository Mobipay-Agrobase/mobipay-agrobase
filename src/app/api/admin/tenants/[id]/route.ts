import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const allowed = ['name', 'country', 'plan', 'status', 'mrr'];
  const data: Record<string, unknown> = {};
  for (const f of allowed) if (body[f] !== undefined) data[f] = body[f];

  const tenant = await db.tenant.update({ where: { id }, data });
  return NextResponse.json({ tenant });
}
