import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const allowed = ['title', 'agenda', 'meetingDate', 'startTime', 'endTime', 'meetingType', 'location', 'notes', 'minutes', 'status'];
  const data: Record<string, unknown> = {};
  for (const f of allowed) if (body[f] !== undefined) data[f] = body[f];

  const meeting = await db.vslaMeeting.update({ where: { id }, data });
  return NextResponse.json({ meeting });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = await db.vslaMeeting.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
  return NextResponse.json({ meeting });
}
