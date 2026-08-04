/**
 * VSLA V2 — Single Group: Get details + Update settings
 * Each group has its own dynamic configuration that admins can change anytime.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { logSecureAction } from '@/lib/security/secure-audit-logger'
import { z } from 'zod'

// ─── GET: Full group details with key holders, members, cycle, cashbox ───
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const group = await db.vslaGroupV2.findUnique({
      where: { id },
      include: {
        keyHolders: { where: { status: 'ACTIVE' }, orderBy: { assignedAt: 'asc' } },
        cycles: { orderBy: { startDate: 'desc' }, take: 3 },
        _count: { select: { members: true, loans: true, meetings: true, cashboxEntries: true } },
      },
    })

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    // Tenant isolation
    if (!ctx.isSuperAdmin && !ctx.tenantScope.includes(group.tenantId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get active cycle
    const activeCycle = await db.vslaCycleV2.findFirst({
      where: { groupId: id, status: { in: ['ACTIVE', 'FROZEN'] } },
    })

    // Get recent cashbox entries
    const recentEntries = await db.vslaCashboxEntryV2.findMany({
      where: { groupId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      group: {
        ...group,
        activeCycle,
        recentCashboxEntries: recentEntries,
      },
    })
  } catch (error) {
    console.error('[vsla-v2/groups/[id] GET] error:', error)
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 })
  }
}

// ─── Update Group Settings Schema ───
const UpdateGroupSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  description: z.string().max(500).optional(),
  // Savings config
  sharePrice: z.number().positive().max(100000).optional(),
  // Loan config
  loanMultiplier: z.number().positive().max(10).optional(),
  // Welfare
  welfareContribution: z.number().min(0).optional(),
  // Fines
  lateAttendanceFine: z.number().min(0).optional(),
  absenceFine: z.number().min(0).optional(),
  // Cycle
  cycleLengthDays: z.number().int().min(30).max(730).optional(),
  // Key holder config
  minKeyHolders: z.number().int().min(3).max(6).optional(),
  maxKeyHolders: z.number().int().min(3).max(6).optional(),
  // Status
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CLOSED']).optional(),
}).strict()

// ─── PUT: Update group settings ───
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    let validated
    try {
      validated = UpdateGroupSchema.parse(body)
    } catch (err: any) {
      return NextResponse.json({
        error: 'Validation failed',
        fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [],
      }, { status: 400 })
    }

    // Verify group exists + tenant isolation
    const existing = await db.vslaGroupV2.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    if (!ctx.isSuperAdmin && !ctx.tenantScope.includes(existing.tenantId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate minKeyHolders <= maxKeyHolders
    const minKH = validated.minKeyHolders ?? existing.minKeyHolders
    const maxKH = validated.maxKeyHolders ?? existing.maxKeyHolders
    if (minKH > maxKH) {
      return NextResponse.json({ error: 'minKeyHolders cannot be greater than maxKeyHolders' }, { status: 400 })
    }

    // Check if group has existing key holders and the new max is lower
    if (validated.maxKeyHolders !== undefined && validated.maxKeyHolders < existing.maxKeyHolders) {
      const activeKeyHolders = await db.vslaKeyHolderV2.count({
        where: { groupId: id, status: 'ACTIVE' },
      })
      if (activeKeyHolders > validated.maxKeyHolders) {
        return NextResponse.json({
          error: `Cannot reduce maxKeyHolders to ${validated.maxKeyHolders} — group currently has ${activeKeyHolders} active key holders. Remove some first.`,
        }, { status: 400 })
      }
    }

    // Track what changed for audit log
    const changes: Record<string, { from: any; to: any }> = {}
    for (const [key, value] of Object.entries(validated)) {
      if ((existing as any)[key] !== value) {
        changes[key] = { from: (existing as any)[key], to: value }
      }
    }

    // Update the group
    const updated = await db.vslaGroupV2.update({
      where: { id },
      data: validated,
    })

    // Secure audit log
    await logSecureAction({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorRole: ctx.role,
      action: 'VSLA_V2_GROUP_SETTINGS_UPDATED',
      entityType: 'VslaGroupV2',
      entityId: id,
      description: `Updated settings for group "${updated.name}" — ${Object.keys(changes).length} field(s) changed`,
      metadata: { changes },
      httpMethod: 'PUT',
      path: `/api/vsla-v2/groups/${id}`,
    })

    return NextResponse.json({
      group: updated,
      changes,
      message: 'Group settings updated successfully',
    })
  } catch (error) {
    console.error('[vsla-v2/groups/[id] PUT] error:', error)
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
  }
}
