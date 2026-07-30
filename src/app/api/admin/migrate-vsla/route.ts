import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { headers } from 'next/headers'
import { invalidateTenant } from '@/middleware/edge-entitlements'

/**
 * POST /api/admin/migrate-vsla
 *   SUPER_ADMIN only. Triggers the P3 migration: re-parents every VSLA group
 *   (and cascades to VslaLoan, VslaLoanRepayment, VslaMeeting, VslaAttendance)
 *   to the target VSLA_PROVIDER tenant.
 *
 *   Body (all optional):
 *     - targetTenantId: string   — explicit target tenant ID
 *     - targetTenantName: string — used to find OR create a VSLA_PROVIDER tenant
 *     - dryRun: boolean          — if true, returns the planned changes without writing
 *
 *   Returns:
 *     200: { success: true, data: { targetTenantId, targetTenantName, counts, dryRun } }
 *     403: SUPER_ADMIN only
 *     400: target tenant missing/wrong type/suspended
 *     500: migration failed (transaction rolled back)
 *
 * Audit: writes one AuditLog entry with action='VSLA_MIGRATE_TO_STANDALONE_TENANT'
 *        on success, or action='VSLA_MIGRATE_TO_STANDALONE_TENANT_FAILED' on failure.
 *
 * Security:
 *   - SUPER_ADMIN only (403 otherwise)
 *   - Refuses to migrate from a SUPER_ADMIN tenant (defensive — these shouldn't host VSLA data)
 *   - All writes happen in a single Prisma $transaction
 *   - On failure, the transaction is rolled back and an audit entry is written
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    if (!ctx.isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Super Admin access required' },
        { status: 403 },
      )
    }

    const body = await request.json().catch(() => ({})) as {
      targetTenantId?: string
      targetTenantName?: string
      dryRun?: boolean
    }
    const dryRun = !!body.dryRun

    // ─── 1. Resolve target tenant ─────────────────────────────────────────
    let targetTenant: { id: string; name: string; type: string; isActive: boolean } | null = null
    let targetCreated = false

    if (body.targetTenantId) {
      targetTenant = await db.tenant.findUnique({
        where: { id: body.targetTenantId },
        select: { id: true, name: true, type: true, isActive: true },
      })
      if (!targetTenant) {
        return NextResponse.json(
          { success: false, error: `Target tenant with id ${body.targetTenantId} not found` },
          { status: 404 },
        )
      }
    } else if (body.targetTenantName) {
      targetTenant = await db.tenant.findFirst({
        where: { name: body.targetTenantName, type: 'VSLA_PROVIDER' },
        select: { id: true, name: true, type: true, isActive: true },
      })
      if (!targetTenant && !dryRun) {
        targetTenant = await db.tenant.create({
          data: {
            name: body.targetTenantName,
            type: 'VSLA_PROVIDER',
            country: 'Uganda',
            defaultCurrency: 'UGX',
            isActive: true,
          },
          select: { id: true, name: true, type: true, isActive: true },
        })
        targetCreated = true
      }
    } else {
      // Default: any active VSLA_PROVIDER tenant
      targetTenant = await db.tenant.findFirst({
        where: { type: 'VSLA_PROVIDER', isActive: true },
        select: { id: true, name: true, type: true, isActive: true },
      })
      if (!targetTenant && !dryRun) {
        // Auto-create the default tenant
        targetTenant = await db.tenant.create({
          data: {
            name: 'Agrobase VSLA',
            type: 'VSLA_PROVIDER',
            country: 'Uganda',
            defaultCurrency: 'UGX',
            isActive: true,
          },
          select: { id: true, name: true, type: true, isActive: true },
        })
        targetCreated = true
      }
    }

    if (!targetTenant) {
      return NextResponse.json(
        { success: false, error: 'No VSLA_PROVIDER tenant found. Provide targetTenantId or targetTenantName, or run without --dry-run to auto-create.' },
        { status: 400 },
      )
    }

    if (targetTenant.type !== 'VSLA_PROVIDER') {
      return NextResponse.json(
        { success: false, error: `Target tenant ${targetTenant.name} has type '${targetTenant.type}', expected 'VSLA_PROVIDER'` },
        { status: 400 },
      )
    }
    if (!targetTenant.isActive) {
      return NextResponse.json(
        { success: false, error: `Target tenant ${targetTenant.name} is suspended` },
        { status: 400 },
      )
    }

    // ─── 2. Find VSLA groups to migrate ───────────────────────────────────
    const groupsToMigrate = await db.vslaGroup.findMany({
      where: { tenantId: { not: targetTenant.id } },
      select: {
        id: true, name: true, tenantId: true,
      },
    })

    if (groupsToMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          targetTenantId: targetTenant.id,
          targetTenantName: targetTenant.name,
          targetCreated,
          counts: { groups: 0, loans: 0, repayments: 0, meetings: 0, attendance: 0 },
          dryRun,
          message: 'No VSLA groups need migration — every group is already on the target tenant.',
        },
      })
    }

    // Group by source tenant for the report + audit
    const sourceTenantIds = [...new Set(groupsToMigrate.map(g => g.tenantId))]
    const sourceTenants = await db.tenant.findMany({
      where: { id: { in: sourceTenantIds } },
      select: { id: true, name: true, type: true },
    })

    // Refuse to migrate from a SUPER_ADMIN tenant
    const superAdminSource = sourceTenants.find(t => t.type === 'SUPER_ADMIN')
    if (superAdminSource) {
      return NextResponse.json(
        {
          success: false,
          error: `Refusing to migrate VSLA groups from SUPER_ADMIN tenant '${superAdminSource.name}'. SUPER_ADMIN tenants should not host VSLA data — investigate manually.`,
        },
        { status: 400 },
      )
    }

    const groupIds = groupsToMigrate.map(g => g.id)

    // ─── 3. Count related records ─────────────────────────────────────────
    const [loansCount, repaymentsCount, meetingsCount, attendanceCount] = await Promise.all([
      db.vslaLoan.count({ where: { vslaGroupId: { in: groupIds } } }),
      db.vslaLoanRepayment.count({ where: { loan: { vslaGroupId: { in: groupIds } } } }),
      db.vslaMeeting.count({ where: { vslaGroupId: { in: groupIds } } }),
      db.vslaAttendance.count({ where: { meeting: { vslaGroupId: { in: groupIds } } } }),
    ])

    const plannedCounts = {
      groups: groupsToMigrate.length,
      loans: loansCount,
      repayments: repaymentsCount,
      meetings: meetingsCount,
      attendance: attendanceCount,
    }

    // ─── 4. Dry-run response ──────────────────────────────────────────────
    if (dryRun) {
      return NextResponse.json({
        success: true,
        data: {
          targetTenantId: targetTenant.id,
          targetTenantName: targetTenant.name,
          targetCreated,
          sourceTenants: sourceTenants.map(t => ({
            id: t.id, name: t.name, type: t.type,
            groupCount: groupsToMigrate.filter(g => g.tenantId === t.id).length,
          })),
          counts: plannedCounts,
          dryRun: true,
        },
      })
    }

    // ─── 5. Execute the migration in a transaction ────────────────────────
    const result = await db.$transaction(async (tx) => {
      const groupUpdate = await tx.vslaGroup.updateMany({
        where: { id: { in: groupIds } },
        data: { tenantId: targetTenant!.id },
      })
      const loanUpdate = await tx.vslaLoan.updateMany({
        where: { vslaGroupId: { in: groupIds } },
        data: { tenantId: targetTenant!.id },
      })
      const loanIds = await tx.vslaLoan.findMany({
        where: { vslaGroupId: { in: groupIds } },
        select: { id: true },
      })
      const repaymentUpdate = await tx.vslaLoanRepayment.updateMany({
        where: { loanId: { in: loanIds.map(l => l.id) } },
        data: { tenantId: targetTenant!.id },
      })
      const meetingUpdate = await tx.vslaMeeting.updateMany({
        where: { vslaGroupId: { in: groupIds } },
        data: { tenantId: targetTenant!.id },
      })
      const meetingIds = await tx.vslaMeeting.findMany({
        where: { vslaGroupId: { in: groupIds } },
        select: { id: true },
      })
      const attendanceUpdate = await tx.vslaAttendance.updateMany({
        where: { meetingId: { in: meetingIds.map(m => m.id) } },
        data: { tenantId: targetTenant!.id },
      })

      const audit = await tx.auditLog.create({
        data: {
          userId: ctx.userId,
          action: 'VSLA_MIGRATE_TO_STANDALONE_TENANT',
          entityType: 'Tenant',
          entityId: targetTenant!.id,
          details: JSON.stringify({
            targetTenantId: targetTenant!.id,
            targetTenantName: targetTenant!.name,
            targetCreated,
            sourceTenants: sourceTenants.map(t => ({
              id: t.id, name: t.name, type: t.type,
              groupCount: groupsToMigrate.filter(g => g.tenantId === t.id).length,
            })),
            counts: {
              groups: groupUpdate.count,
              loans: loanUpdate.count,
              repayments: repaymentUpdate.count,
              meetings: meetingUpdate.count,
              attendance: attendanceUpdate.count,
            },
          }),
        },
      })

      return { groupUpdate, loanUpdate, repaymentUpdate, meetingUpdate, attendanceUpdate, audit }
    })

    // Invalidate entitlement cache for the target + all source tenants
    invalidateTenant(targetTenant.id)
    for (const sourceId of sourceTenantIds) {
      invalidateTenant(sourceId)
    }

    return NextResponse.json({
      success: true,
      data: {
        targetTenantId: targetTenant.id,
        targetTenantName: targetTenant.name,
        targetCreated,
        sourceTenants: sourceTenants.map(t => ({
          id: t.id, name: t.name, type: t.type,
          groupCount: groupsToMigrate.filter(g => g.tenantId === t.id).length,
        })),
        counts: {
          groups: result.groupUpdate.count,
          loans: result.loanUpdate.count,
          repayments: result.repaymentUpdate.count,
          meetings: result.meetingUpdate.count,
          attendance: result.attendanceUpdate.count,
        },
        auditLogId: result.audit.id,
        dryRun: false,
      },
    })
  } catch (error) {
    console.error('[migrate-vsla POST]', error)

    // Best-effort audit log of the failure
    try {
      const ctx = await getTenantContext(request)
      const headersList = await headers()
      const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headersList.get('x-real-ip') || undefined
      await db.auditLog.create({
        data: {
          userId: ctx.userId,
          action: 'VSLA_MIGRATE_TO_STANDALONE_TENANT_FAILED',
          entityType: 'Tenant',
          details: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
          ipAddress,
        },
      }).catch(() => { /* non-blocking */ })
    } catch { /* non-blocking */ }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed',
      },
      { status: 500 },
    )
  }
}

/**
 * GET /api/admin/migrate-vsla
 *   Returns a dry-run preview of what would be migrated. SUPER_ADMIN only.
 *   Equivalent to POST with { dryRun: true } but easier to call from a UI button.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    if (!ctx.isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Super Admin access required' },
        { status: 403 },
      )
    }

    // Find target tenant (any active VSLA_PROVIDER tenant)
    const targetTenant = await db.tenant.findFirst({
      where: { type: 'VSLA_PROVIDER', isActive: true },
      select: { id: true, name: true, type: true, isActive: true },
    })

    if (!targetTenant) {
      return NextResponse.json({
        success: true,
        data: {
          targetTenant: null,
          message: 'No VSLA_PROVIDER tenant exists yet. POST to /api/admin/migrate-vsla to auto-create one and run the migration.',
          sourceTenants: [],
          counts: { groups: 0, loans: 0, repayments: 0, meetings: 0, attendance: 0 },
        },
      })
    }

    const groupsToMigrate = await db.vslaGroup.findMany({
      where: { tenantId: { not: targetTenant.id } },
      select: { id: true, name: true, tenantId: true },
    })
    const groupIds = groupsToMigrate.map(g => g.id)
    const sourceTenantIds = [...new Set(groupsToMigrate.map(g => g.tenantId))]
    const sourceTenants = await db.tenant.findMany({
      where: { id: { in: sourceTenantIds } },
      select: { id: true, name: true, type: true },
    })

    const [loansCount, repaymentsCount, meetingsCount, attendanceCount] = await Promise.all([
      db.vslaLoan.count({ where: { vslaGroupId: { in: groupIds } } }),
      db.vslaLoanRepayment.count({ where: { loan: { vslaGroupId: { in: groupIds } } } }),
      db.vslaMeeting.count({ where: { vslaGroupId: { in: groupIds } } }),
      db.vslaAttendance.count({ where: { meeting: { vslaGroupId: { in: groupIds } } } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        targetTenant,
        sourceTenants: sourceTenants.map(t => ({
          id: t.id, name: t.name, type: t.type,
          groupCount: groupsToMigrate.filter(g => g.tenantId === t.id).length,
        })),
        counts: {
          groups: groupsToMigrate.length,
          loans: loansCount,
          repayments: repaymentsCount,
          meetings: meetingsCount,
          attendance: attendanceCount,
        },
      },
    })
  } catch (error) {
    console.error('[migrate-vsla GET]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to preview migration' },
      { status: 500 },
    )
  }
}
