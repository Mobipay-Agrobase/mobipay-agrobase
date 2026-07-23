import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Reverse the saving
  const saving = await db.vslaSaving.update({
    where: { id },
    data: { status: 'REVERSED', reversedAt: new Date() },
  });
  return NextResponse.json({ saving });
}
