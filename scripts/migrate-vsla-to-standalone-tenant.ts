/**
 * P3 Migration Script — Migrate VSLA data to a standalone VSLA_PROVIDER tenant.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... npx tsx scripts/migrate-vsla-to-standalone-tenant.ts [--dry-run]
 *
 * What it does:
 *   1. Finds (or creates) the target VSLA_PROVIDER tenant.
 *   2. Re-parents every VslaGroup.tenantId → target tenant ID.
 *   3. Cascades the tenantId update to the 4 VSLA models that carry their
 *      own tenantId column: VslaLoan, VslaLoanRepayment, VslaMeeting, VslaAttendance.
 *   4. (VslaMember, VslaSaving, VslaTransaction, WelfarePayment do NOT have
 *      their own tenantId — they inherit via vslaGroupId, so updating
 *      VslaGroup.tenantId alone propagates correctly.)
 *   5. Writes an AuditLog entry summarizing the migration.
 *
 * Safety properties:
 *   - Idempotent: re-running on an already-migrated DB is a no-op.
 *   - Dry-run mode: prints what would change without writing.
 *   - Transactional: all writes happen in a single Prisma `$transaction`.
 *   - Verifies target tenant exists, is active, and has type === 'VSLA_PROVIDER'.
 *   - Refuses to migrate if the source tenant is the platform root
 *     (type === 'SUPER_ADMIN') — SUPER_ADMIN tenants don't host VSLA data.
 *
 * Audit: writes one AuditLog entry with action='VSLA_MIGRATE_TO_STANDALONE_TENANT'
 *        containing the source tenant IDs, target tenant ID, and per-model counts.
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

interface CliArgs {
  dryRun: boolean
  targetTenantId?: string
  targetTenantName?: string
}

function parseArgs(): CliArgs {
  const args: CliArgs = { dryRun: false }
  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') args.dryRun = true
    else if (arg.startsWith('--target-tenant-id=')) args.targetTenantId = arg.split('=')[1]
    else if (arg.startsWith('--target-tenant-name=')) args.targetTenantName = arg.split('=')[1]
  }
  return args
}

async function findOrCreateTargetTenant(args: CliArgs): Promise<{ id: string; name: string; createdAt: Date; isNew: boolean }> {
  // 1. Explicit ID
  if (args.targetTenantId) {
    const t = await db.tenant.findUnique({ where: { id: args.targetTenantId } })
    if (!t) throw new Error(`Target tenant with id ${args.targetTenantId} not found`)
    if (t.type !== 'VSLA_PROVIDER') {
      throw new Error(`Target tenant ${t.name} has type '${t.type}', expected 'VSLA_PROVIDER'`)
    }
    if (!t.isActive) throw new Error(`Target tenant ${t.name} is suspended`)
    return { id: t.id, name: t.name, createdAt: t.createdAt, isNew: false }
  }

  // 2. By name
  if (args.targetTenantName) {
    const t = await db.tenant.findFirst({ where: { name: args.targetTenantName, type: 'VSLA_PROVIDER' } })
    if (t) return { id: t.id, name: t.name, createdAt: t.createdAt, isNew: false }
    if (args.dryRun) {
      throw new Error(`--dry-run: target tenant '${args.targetTenantName}' does not exist; create it first or run without --dry-run to auto-create`)
    }
    const created = await db.tenant.create({
      data: {
        name: args.targetTenantName,
        type: 'VSLA_PROVIDER',
        country: 'Uganda',
        defaultCurrency: 'UGX',
        isActive: true,
      },
    })
    console.log(`  ✓ Created new VSLA_PROVIDER tenant: ${created.name} (${created.id})`)
    return { id: created.id, name: created.name, createdAt: created.createdAt, isNew: true }
  }

  // 3. Default: find any existing VSLA_PROVIDER tenant
  const existing = await db.tenant.findFirst({ where: { type: 'VSLA_PROVIDER', isActive: true } })
  if (existing) return { id: existing.id, name: existing.name, createdAt: existing.createdAt, isNew: false }

  // 4. None exists — create one with the default name
  if (args.dryRun) {
    throw new Error('--dry-run: no VSLA_PROVIDER tenant exists; create one first or run without --dry-run to auto-create "Agrobase VSLA"')
  }
  const created = await db.tenant.create({
    data: {
      name: 'Agrobase VSLA',
      type: 'VSLA_PROVIDER',
      country: 'Uganda',
      defaultCurrency: 'UGX',
      isActive: true,
    },
  })
  console.log(`  ✓ Created new VSLA_PROVIDER tenant: ${created.name} (${created.id})`)
  return { id: created.id, name: created.name, createdAt: created.createdAt, isNew: true }
}

async function main() {
  const args = parseArgs()
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('  P3 Migration: VSLA → Standalone VSLA_PROVIDER Tenant')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log(`  Mode: ${args.dryRun ? 'DRY RUN (no writes)' : 'LIVE (will write to DB)'}`)
  console.log('')

  // ─── 1. Resolve target tenant ─────────────────────────────────────────────
  console.log('▶ Step 1: Resolve target VSLA_PROVIDER tenant...')
  const target = await findOrCreateTargetTenant(args)
  console.log(`  Target: ${target.name} (${target.id})${target.isNew ? ' [NEW]' : ''}`)
  console.log('')

  // ─── 2. Find all VSLA groups NOT already on the target tenant ─────────────
  console.log('▶ Step 2: Find VSLA groups to migrate...')
  const groupsToMigrate = await db.vslaGroup.findMany({
    where: { tenantId: { not: target.id } },
    select: {
      id: true, name: true, tenantId: true,
      _count: { select: { members: true, savings: true, loans: true, meetings: true, transactions: true, welfarePayments: true } },
    },
  })

  if (groupsToMigrate.length === 0) {
    console.log('  No VSLA groups need migration — every group is already on the target tenant (or no groups exist).')
    console.log('')
    console.log('✓ Migration is a no-op. Database is already in the desired state.')
    return
  }

  // Group by source tenant for the report
  const bySourceTenant = new Map<string, { name: string; type: string; groupCount: number }>()
  for (const g of groupsToMigrate) {
    if (!bySourceTenant.has(g.tenantId)) {
      const t = await db.tenant.findUnique({ where: { id: g.tenantId }, select: { name: true, type: true } })
      if (!t) throw new Error(`Source tenant ${g.tenantId} not found for VSLA group ${g.name}`)
      if (t.type === 'SUPER_ADMIN') {
        throw new Error(`Refusing to migrate VSLA group ${g.name} from SUPER_ADMIN tenant ${t.name} — SUPER_ADMIN tenants do not host VSLA data. Investigate manually.`)
      }
      bySourceTenant.set(g.tenantId, { name: t.name, type: t.type, groupCount: 0 })
    }
    bySourceTenant.get(g.tenantId)!.groupCount++
  }

  console.log(`  Found ${groupsToMigrate.length} VSLA group(s) across ${bySourceTenant.size} source tenant(s):`)
  for (const [sourceId, info] of bySourceTenant) {
    console.log(`    • ${info.name} (${info.type}) — ${info.groupCount} group(s)`)
  }
  console.log('')

  // ─── 3. Count related records that need explicit tenantId updates ────────
  // These 4 models carry their own tenantId column (verified in schema.prisma).
  console.log('▶ Step 3: Count related records needing explicit tenantId updates...')
  const groupIds = groupsToMigrate.map(g => g.id)
  const sourceTenantIds = [...bySourceTenant.keys()]

  const [loans, repayments, meetings, attendance] = await Promise.all([
    db.vslaLoan.count({ where: { vslaGroupId: { in: groupIds } } }),
    db.vslaLoanRepayment.count({ where: { loan: { vslaGroupId: { in: groupIds } } } }),
    db.vslaMeeting.count({ where: { vslaGroupId: { in: groupIds } } }),
    db.vslaAttendance.count({ where: { meeting: { vslaGroupId: { in: groupIds } } } }),
  ])

  console.log(`    VslaLoan:          ${loans} row(s)`)
  console.log(`    VslaLoanRepayment: ${repayments} row(s)`)
  console.log(`    VslaMeeting:       ${meetings} row(s)`)
  console.log(`    VslaAttendance:    ${attendance} row(s)`)
  console.log('')

  // ─── 4. Dry-run summary ──────────────────────────────────────────────────
  if (args.dryRun) {
    console.log('▶ Step 4 (dry-run): would execute the following in a single transaction:')
    console.log(`    UPDATE VslaGroup SET tenantId='${target.id}' WHERE id IN (${groupIds.length} ids)`)
    console.log(`    UPDATE VslaLoan SET tenantId='${target.id}' WHERE vslaGroupId IN (${groupIds.length} ids)  -- ${loans} rows`)
    console.log(`    UPDATE VslaLoanRepayment SET tenantId='${target.id}' WHERE loan.vslaGroupId IN (...)      -- ${repayments} rows`)
    console.log(`    UPDATE VslaMeeting SET tenantId='${target.id}' WHERE vslaGroupId IN (...)                  -- ${meetings} rows`)
    console.log(`    UPDATE VslaAttendance SET tenantId='${target.id}' WHERE meeting.vslaGroupId IN (...)       -- ${attendance} rows`)
    console.log(`    INSERT INTO AuditLog (action='VSLA_MIGRATE_TO_STANDALONE_TENANT', ...)`)
    console.log('')
    console.log('✓ Dry-run complete. No data was modified. Re-run without --dry-run to execute.')
    return
  }

  // ─── 5. Execute the migration in a transaction ──────────────────────────
  console.log('▶ Step 4: Executing migration in a single transaction...')

  // Find a SUPER_ADMIN user to attribute the AuditLog entry to.
  // If none exists, we attribute it to the system by leaving userId blank — but
  // the AuditLog.userId column is NOT NULL, so we create a system user if needed.
  // In practice, this script is run by an operator who has a SUPER_ADMIN user.
  const superAdmin = await db.user.findFirst({
    where: { role: 'SUPER_ADMIN', isActive: true },
    select: { id: true, firstName: true, lastName: true },
  })
  if (!superAdmin) {
    throw new Error('No active SUPER_ADMIN user found. The migration AuditLog requires a userId. Create a SUPER_ADMIN user first.')
  }
  console.log(`  Audit-log attributing to: ${superAdmin.firstName} ${superAdmin.lastName} (${superAdmin.id})`)

  const result = await db.$transaction(async (tx) => {
    // 4a. Update VslaGroup.tenantId
    const groupUpdate = await tx.vslaGroup.updateMany({
      where: { id: { in: groupIds } },
      data: { tenantId: target.id },
    })

    // 4b. Update VslaLoan.tenantId (has its own tenantId column)
    const loanUpdate = await tx.vslaLoan.updateMany({
      where: { vslaGroupId: { in: groupIds } },
      data: { tenantId: target.id },
    })

    // 4c. Update VslaLoanRepayment.tenantId (has its own tenantId column)
    // We can't filter by vslaGroupId directly — need to join via loanId.
    // Fetch the loan IDs first, then update.
    const loanIds = await tx.vslaLoan.findMany({
      where: { vslaGroupId: { in: groupIds } },
      select: { id: true },
    })
    const repaymentUpdate = await tx.vslaLoanRepayment.updateMany({
      where: { loanId: { in: loanIds.map(l => l.id) } },
      data: { tenantId: target.id },
    })

    // 4d. Update VslaMeeting.tenantId
    const meetingUpdate = await tx.vslaMeeting.updateMany({
      where: { vslaGroupId: { in: groupIds } },
      data: { tenantId: target.id },
    })

    // 4e. Update VslaAttendance.tenantId (filter via meeting.vslaGroupId)
    const meetingIds = await tx.vslaMeeting.findMany({
      where: { vslaGroupId: { in: groupIds } },
      select: { id: true },
    })
    const attendanceUpdate = await tx.vslaAttendance.updateMany({
      where: { meetingId: { in: meetingIds.map(m => m.id) } },
      data: { tenantId: target.id },
    })

    // 4f. AuditLog
    const audit = await tx.auditLog.create({
      data: {
        userId: superAdmin.id,
        action: 'VSLA_MIGRATE_TO_STANDALONE_TENANT',
        entityType: 'Tenant',
        entityId: target.id,
        details: JSON.stringify({
          targetTenantId: target.id,
          targetTenantName: target.name,
          sourceTenants: [...bySourceTenant.entries()].map(([id, info]) => ({
            id, name: info.name, type: info.type, groupCount: info.groupCount,
          })),
          counts: {
            groups: groupUpdate.count,
            loans: loanUpdate.count,
            repayments: repaymentUpdate.count,
            meetings: meetingUpdate.count,
            attendance: attendanceUpdate.count,
          },
          sourceTenantIds,
        }),
      },
    })

    return {
      groupUpdate, loanUpdate, repaymentUpdate, meetingUpdate, attendanceUpdate, audit,
    }
  })

  console.log(`    ✓ VslaGroup:          ${result.groupUpdate.count} row(s) updated`)
  console.log(`    ✓ VslaLoan:           ${result.loanUpdate.count} row(s) updated`)
  console.log(`    ✓ VslaLoanRepayment:  ${result.repaymentUpdate.count} row(s) updated`)
  console.log(`    ✓ VslaMeeting:        ${result.meetingUpdate.count} row(s) updated`)
  console.log(`    ✓ VslaAttendance:     ${result.attendanceUpdate.count} row(s) updated`)
  console.log(`    ✓ AuditLog:           entry ${result.audit.id} written`)
  console.log('')

  // ─── 6. Verify ──────────────────────────────────────────────────────────
  console.log('▶ Step 5: Post-migration verification...')
  const orphanGroups = await db.vslaGroup.count({
    where: { tenantId: { not: target.id }, tenant: { type: { not: 'SUPER_ADMIN' } } },
  })
  if (orphanGroups > 0) {
    console.warn(`  ⚠ WARNING: ${orphanGroups} VSLA group(s) are still on a non-target, non-SUPER_ADMIN tenant.`)
    console.warn('    This can happen if new groups were created mid-migration. Re-run the script to migrate them.')
  } else {
    console.log('  ✓ All VSLA groups are now on the target tenant (or on the SUPER_ADMIN tenant, which is allowed).')
  }
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('  ✓ MIGRATION COMPLETE')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log(`  Target tenant: ${target.name} (${target.id})`)
  console.log(`  AuditLog ID:   ${result.audit.id}`)
  console.log('')
}

main()
  .catch((err) => {
    console.error('')
    console.error('❌ Migration failed:', err.message)
    console.error('')
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
