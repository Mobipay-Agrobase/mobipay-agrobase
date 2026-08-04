/**
 * VSLA V2 — Key Holder Assignment
 * SRS 3.3: Assign 3-6 key holders per group for unanimous loan approval
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { logSecureAction } from '@/lib/security/secure-audit-logger'
import { z } from 'zod'

const AssignKeyHoldersSchema = z.object({
  keyHolders: z.array(z.object({
    memberId: z.string().min(1),
    fullName: z.string().min(2),
    phone: z.string().min(10),
    nationalId: z.string().optional(),
    role: z.enum(['CHAIRPERSON', 'SECRETARY', 'TREASURER', 'KEYHOLDER']),
  })).min(3, 'At least 3 key holders required').max(6, 'Maximum 6 key holders'),
}).strict()

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: groupId } = await params
    const body = await req.json()
    let validated
    try {
      validated = AssignKeyHoldersSchema.parse(body)
    } catch (err: any) {
      return NextResponse.json({
        error: 'Validation failed',
        fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [],
      }, { status: 400 })
    }

    // Verify group exists
    const group = await db.vslaGroupV2.findUnique({ where: { id: groupId } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    // Check key holder count against group config
    if (validated.keyHolders.length < group.minKeyHolders) {
      return NextResponse.json({ error: `Minimum ${group.minKeyHolders} key holders required` }, { status: 400 })
    }
    if (validated.keyHolders.length > group.maxKeyHolders) {
      return NextResponse.json({ error: `Maximum ${group.maxKeyHolders} key holders allowed` }, { status: 400 })
    }

    // Remove existing key holders, then assign new ones
    await db.vslaKeyHolderV2.deleteMany({ where: { groupId, status: 'ACTIVE' } })
    const keyHolders = await Promise.all(
      validated.keyHolders.map(kh =>
        db.vslaKeyHolderV2.create({
          data: {
            groupId,
            memberId: kh.memberId,
            fullName: kh.fullName,
            phone: kh.phone,
            nationalId: kh.nationalId,
            role: kh.role,
            status: 'ACTIVE',
          },
        })
      )
    )

    await logSecureAction({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorRole: ctx.role,
      action: 'VSLA_V2_KEY_HOLDERS_ASSIGNED',
      entityType: 'VslaGroupV2',
      entityId: groupId,
      description: `Assigned ${keyHolders.length} key holders to group "${group.name}"`,
      metadata: { count: keyHolders.length, roles: validated.keyHolders.map(k => k.role) },
      httpMethod: 'POST',
      path: `/api/vsla-v2/groups/${groupId}/key-holders`,
    })

    return NextResponse.json({ keyHolders }, { status: 201 })
  } catch (error) {
    console.error('[vsla-v2/key-holders POST] error:', error)
    return NextResponse.json({ error: 'Failed to assign key holders' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id: groupId } = await params
    const keyHolders = await db.vslaKeyHolderV2.findMany({
      where: { groupId, status: 'ACTIVE' },
      orderBy: { assignedAt: 'asc' },
    })
    return NextResponse.json({ keyHolders })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch key holders' }, { status: 500 })
  }
}
