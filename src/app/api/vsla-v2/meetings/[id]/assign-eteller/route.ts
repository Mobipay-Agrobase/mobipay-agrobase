/**
 * VSLA V2 — Assign E-Teller
 * SRS 3.4, 5.2: Any member can act as E-Teller at a meeting
 * The E-Teller records savings, loans, welfare, and fines through the app
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { logSecureAction } from '@/lib/security/secure-audit-logger'
import { z } from 'zod'

const AssignETellerSchema = z.object({
  memberId: z.string().min(1),
}).strict()

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: meetingId } = await params
    const body = await req.json()
    let validated
    try {
      validated = AssignETellerSchema.parse(body)
    } catch (err: any) {
      return NextResponse.json({
        error: 'Validation failed',
        fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [],
      }, { status: 400 })
    }

    // Verify meeting exists
    const meeting = await db.vslaMeetingV2.findUnique({
      where: { id: meetingId },
      include: { group: true },
    })
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

    // Verify member exists and is in the same group
    const member = await db.vslaMemberV2.findFirst({
      where: { id: validated.memberId, groupId: meeting.groupId, status: 'ACTIVE' },
    })
    if (!member) return NextResponse.json({ error: 'Member not found in this group' }, { status: 404 })

    // Deactivate any existing E-Teller assignments for this meeting
    await db.vslaETellerV2.updateMany({
      where: { meetingId, isActive: true },
      data: { isActive: false },
    })

    // Assign new E-Teller
    const eteller = await db.vslaETellerV2.create({
      data: {
        meetingId,
        memberId: validated.memberId,
        assignedById: ctx.userId,
        isActive: true,
      },
    })

    await logSecureAction({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorRole: ctx.role,
      action: 'VSLA_V2_ETELLER_ASSIGNED',
      entityType: 'VslaMeetingV2',
      entityId: meetingId,
      description: `E-Teller assigned: ${member.fullName} for meeting #${meeting.meetingNumber}`,
      metadata: { meetingId, memberId: validated.memberId, memberName: member.fullName },
      httpMethod: 'POST',
      path: `/api/vsla-v2/meetings/${meetingId}/assign-eteller`,
    })

    return NextResponse.json({
      eteller,
      member: { id: member.id, fullName: member.fullName, memberId: member.memberId },
      message: `${member.fullName} is now the E-Teller for this meeting. They can record savings, loans, welfare, and fines.`,
    }, { status: 201 })
  } catch (error) {
    console.error('[vsla-v2/assign-eteller POST] error:', error)
    return NextResponse.json({ error: 'Failed to assign E-Teller' }, { status: 500 })
  }
}
