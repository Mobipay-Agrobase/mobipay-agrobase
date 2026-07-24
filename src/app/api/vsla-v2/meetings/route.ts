/**
 * VSLA V2 — List all meetings (with filters)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const groupId = url.searchParams.get('groupId')
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    const where: Record<string, unknown> = {}
    if (groupId) where.groupId = groupId
    if (status) where.status = status

    // Tenant isolation
    if (!ctx.isSuperAdmin) {
      where.group = { tenantId: { in: ctx.tenantScope } }
    }

    const meetings = await db.vslaMeetingV2.findMany({
      where,
      include: {
        group: { select: { name: true, code: true, district: true } },
        _count: { select: { attendance: true, etellerAssignments: true } },
      },
      orderBy: { meetingDate: 'desc' },
      take: limit,
    })

    return NextResponse.json({ meetings })
  } catch (error) {
    console.error('[vsla-v2/meetings GET] error:', error)
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 })
  }
}
