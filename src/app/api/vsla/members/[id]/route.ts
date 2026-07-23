import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const allowed = ['fullName', 'phone', 'email', 'nationalId', 'gender', 'occupation', 'nextOfKin', 'nextOfKinPhone', 'status'];
  const data: Record<string, unknown> = {};
  for (const f of allowed) if (body[f] !== undefined) data[f] = body[f];

  if (body.status === 'EXITED' && !body.exitedAt) data.exitedAt = new Date();

  const member = await db.vslaMember.update({ where: { id }, data });
  return NextResponse.json({ member });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Soft delete — mark as EXITED
  const member = await db.vslaMember.update({
    where: { id },
    data: { status: 'EXITED', exitedAt: new Date(), exitReason: 'Admin removal' },
  });
  return NextResponse.json({ member });
}
