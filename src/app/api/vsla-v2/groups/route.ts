/**
 * VSLA V2 — Group Management
 * SRS 3.3: Group onboarding with key holder setup, cycle config, share price, welfare, fines
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { logSecureAction } from '@/lib/security/secure-audit-logger'
import { z } from 'zod'

const CreateGroupSchema = z.object({
  name: z.string().min(2).max(100),
  region: z.string().optional(),
  district: z.string().optional(),
  description: z.string().max(500).optional(),
  sharePrice: z.number().positive().max(100000).default(5000),
  loanMultiplier: z.number().positive().max(10).default(3),
  welfareContribution: z.number().min(0).default(0),
  lateAttendanceFine: z.number().min(0).default(500),
  absenceFine: z.number().min(0).default(2000),
  cycleLengthDays: z.number().int().min(30).max(730).default(365),
  minKeyHolders: z.number().int().min(3).max(6).default(3),
  maxKeyHolders: z.number().int().min(3).max(6).default(6),
}).strict()

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const where = ctx.isSuperAdmin ? {} : { tenantId: { in: ctx.tenantScope } }
    const groups = await db.vslaGroupV2.findMany({
      where,
      include: {
        _count: { select: { members: true, keyHolders: true, loans: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ groups })
  } catch (error) {
    console.error('[vsla-v2/groups GET] error:', error)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    let validated
    try {
      validated = CreateGroupSchema.parse(body)
    } catch (err: any) {
      return NextResponse.json({
        error: 'Validation failed',
        fields: err.issues?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || [],
      }, { status: 400 })
    }

    const code = `VSLA-V2-${Date.now().toString(36).toUpperCase()}`
    const group = await db.vslaGroupV2.create({
      data: {
        ...validated,
        tenantId: ctx.tenantId,
        code,
        status: 'ACTIVE',
      },
    })

    // Create initial cycle
    const startDate = new Date()
    const endDate = new Date(Date.now() + validated.cycleLengthDays * 86400000)
    const freezeDate = new Date(endDate.getTime() - 30 * 86400000) // 30 days before end
    await db.vslaCycleV2.create({
      data: {
        groupId: group.id,
        name: `Cycle ${startDate.getFullYear()}`,
        startDate,
        endDate,
        freezeDate,
        status: 'ACTIVE',
      },
    })

    await logSecureAction({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorRole: ctx.role,
      action: 'VSLA_V2_GROUP_CREATED',
      entityType: 'VslaGroupV2',
      entityId: group.id,
      description: `Created VSLA V2 group "${group.name}" (${code})`,
      metadata: { name: validated.name, sharePrice: validated.sharePrice, loanMultiplier: validated.loanMultiplier },
      httpMethod: 'POST',
      path: '/api/vsla-v2/groups',
    })

    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    console.error('[vsla-v2/groups POST] error:', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
