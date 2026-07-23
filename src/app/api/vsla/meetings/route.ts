import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('groupId');
  const where: Record<string, unknown> = {};
  if (groupId) where.groupId = groupId;

  const meetings = await db.vslaMeeting.findMany({
    where,
    include: {
      group: { select: { name: true, code: true } },
      attendance: { include: { member: { select: { fullName: true, memberId: true } } } },
      _count: { select: { attendance: true } },
    },
    orderBy: { meetingDate: 'desc' },
  });
  return NextResponse.json({ meetings });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { groupId, title, agenda, meetingDate, startTime, endTime, meetingType = 'REGULAR', location, notes, createdById } = body;

  if (!groupId || !title || !meetingDate) {
    return NextResponse.json({ error: 'groupId, title, meetingDate required' }, { status: 400 });
  }

  // Auto-number the meeting
  const lastMeeting = await db.vslaMeeting.findFirst({
    where: { groupId },
    orderBy: { meetingNumber: 'desc' },
  });
  const meetingNumber = (lastMeeting?.meetingNumber ?? 0) + 1;

  const meeting = await db.vslaMeeting.create({
    data: {
      groupId, meetingNumber, title, agenda,
      meetingDate: new Date(meetingDate),
      startTime, endTime, meetingType, location, notes,
      status: 'SCHEDULED',
      createdById,
    },
  });
  return NextResponse.json({ meeting }, { status: 201 });
}
