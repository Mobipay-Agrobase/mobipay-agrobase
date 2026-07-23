import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/vsla/meetings/[id]/attendance — bulk upsert attendance
// Body: { attendance: [{ memberId, present, arrivalTime, contributedSavings, notes }] }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { attendance } = body as {
    attendance: Array<{
      memberId: string;
      present: boolean;
      arrivalTime?: string;
      contributedSavings?: number;
      notes?: string;
    }>;
  };

  if (!Array.isArray(attendance)) {
    return NextResponse.json({ error: 'attendance array required' }, { status: 400 });
  }

  // Upsert each attendance record
  await Promise.all(
    attendance.map((a) =>
      db.vslaAttendance.upsert({
        where: { meetingId_memberId: { meetingId: id, memberId: a.memberId } },
        update: {
          present: a.present,
          arrivalTime: a.arrivalTime,
          contributedSavings: a.contributedSavings ?? 0,
          notes: a.notes,
        },
        create: {
          meetingId: id,
          memberId: a.memberId,
          present: a.present,
          arrivalTime: a.arrivalTime,
          contributedSavings: a.contributedSavings ?? 0,
          notes: a.notes,
        },
      })
    )
  );

  // Update meeting summary stats
  const present = attendance.filter((a) => a.present).length;
  const totalSavings = attendance.reduce((sum, a) => sum + (a.contributedSavings ?? 0), 0);
  const totalMembers = await db.vslaMember.count({ where: { groupId: (await db.vslaMeeting.findUnique({ where: { id } }))?.groupId, status: 'ACTIVE' } });

  const meeting = await db.vslaMeeting.update({
    where: { id },
    data: {
      status: 'CONCLUDED',
      attendanceCount: present,
      totalMembers,
      totalSavings,
    },
  });

  return NextResponse.json({ meeting });
}
