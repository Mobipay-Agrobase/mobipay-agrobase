import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

/**
 * Disable modules that are NOT part of the Ekibbo product for the Ekibbo tenant.
 *
 * Why: VSLA is a separate tenant's product, and Marketplace / Payments / Loans /
 * Carbon / MFI / Communication / Feedback are excluded from Ekibbo. Writing
 * ModuleEntitlement rows with isEnabled=false makes:
 *   1. the server middleware return 403 for those API modules
 *      (see src/middleware/edge-entitlements.ts ROUTE_TO_MODULE), and
 *   2. the Sidebar hide those menus for EVERY non-SUPER_ADMIN role in the tenant
 *      — including the shared TENANT_ADMIN role (which cannot be gated by role
 *      prefix alone).
 *
 * Modules without dedicated entitlement codes (e.g. impact_assessment) are instead
 * handled by the tenant-flag UI logic (useIsEkibboTenant / EKB_HIDDEN_MODULES).
 *
 * Run: npx tsx scripts/seed-ekibbo-modules-off.ts
 */

const DISABLED_MODULES: string[] = [
  'VSLA',
  'MARKETPLACE',
  'PAYMENTS',
  'LOANS',
  'CARBON',
  'MFI',
  'COMMUNICATION',
  'FEEDBACK',
]

async function main() {
  const tenant = await db.tenant.findFirst({ where: { name: { contains: 'EKIBBO' } } })
  if (!tenant) {
    console.error('EKIBBO tenant not found. Run scripts/seed-users.ts first.')
    process.exit(1)
  }
  console.log(`Disabling modules for tenant: ${tenant.name} (${tenant.id})`)

  for (const code of DISABLED_MODULES) {
    const existing = await db.moduleEntitlement.findFirst({
      where: { tenantId: tenant.id, moduleCode: code },
    })
    if (existing) {
      await db.moduleEntitlement.update({
        where: { id: existing.id },
        data: { isEnabled: false },
      })
    } else {
      await db.moduleEntitlement.create({
        data: { tenantId: tenant.id, moduleCode: code, isEnabled: false },
      })
    }
    console.log(`  disabled ${code}`)
  }

  console.log(`\nDone. ${DISABLED_MODULES.length} modules disabled for the Ekibbo tenant.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())