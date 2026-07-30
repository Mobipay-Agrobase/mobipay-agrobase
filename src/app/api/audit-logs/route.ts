import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'

/**
 * GET /api/audit-logs
 *   Returns audit log entries for the current user (or for all users if
 *   SUPER_ADMIN). Used by the Profile view ("Recent Activity" tab).
 *
 * Query params:
 *   - limit:  number of entries to return (default 10, max 100)
 *   - offset: pagination offset (default 0)
 *   - userId: filter by user (SUPER_ADMIN only)
 *
 * Returns: { logs: AuditLog[], total: number }
 *
 * Notes:
 *   - Non-super-admin users can only see their OWN entries (enforced by
 *     filtering on ctx.userId).
 *   - SUPER_ADMIN can see all entries OR filter by ?userId=xxx.
 *   - When SUPER_ADMIN is simulating, they see entries for the simulated
 *     tenant only (because ctx.isSuperAdmin is false during simulation).
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10) || 10, 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)
    const filterUserId = searchParams.get('userId')

    // Build where clause
    const where: Record<string, unknown> = {}
    if (ctx.isSuperAdmin) {
      // SUPER_ADMIN (not simulating): can see all, or filter by userId
      if (filterUserId) where.userId = filterUserId
    } else {
      // Non-super-admin OR SUPER_ADMIN simulating: only own entries
      where.userId = ctx.userId
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          userId: true,
          action: true,
          entityType: true,
          entityId: true,
          details: true,
          ipAddress: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      db.auditLog.count({ where }),
    ])

    return NextResponse.json({
      logs: logs.map(l => ({
        id: l.id,
        userId: l.userId,
        userName: `${l.user.firstName} ${l.user.lastName}`,
        userEmail: l.user.email,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        details: l.details ? safeParseDetails(l.details) : null,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[audit-logs GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 },
    )
  }
}

/** Safely parse the JSON details string. Returns the raw string on parse failure. */
function safeParseDetails(details: string): unknown {
  try {
    return JSON.parse(details)
  } catch {
    return details
  }
}
