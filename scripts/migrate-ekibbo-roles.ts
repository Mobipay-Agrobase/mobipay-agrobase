/**
 * One-shot migration: update existing EKIBBO user accounts to use the
 * dedicated EKB_* roles defined in src/lib/permissions.ts.
 *
 * Background:
 *   Until now, every EKIBBO staff member was mapped to one of the generic
 *   roles (TENANT_ADMIN / AGENT / CBT / EXTENSION_OFFICER). This gave the
 *   finance officer full admin privileges — they could see Plot-Level
 *   Traceability, Settings, Roles & Permissions, etc. — and made every role
 *   land on the same TenantAdminDashboard.
 *
 *   After this migration, the seven EKIBBO user accounts are remapped to:
 *
 *     eric@ekibbo.co        TENANT_ADMIN  →  EKB_MD            (Managing Director)
 *     ops@ekibbo.co         TENANT_ADMIN  →  EKB_OPS_MANAGER   (Operations Manager)
 *     finance@ekibbo.co     TENANT_ADMIN  →  EKB_FINANCE       (Finance Officer)
 *     assistant@ekibbo.co   AGENT         →  EKB_FIN_ASSISTANT (Finance & Ops Assistant)
 *     mec@ekibbo.co         CBT           →  EKB_MEC           (M, E & C Officer)
 *     eo1@ekibbo.co         EXTENSION_OFFICER → EKB_EXTENSION  (Extension Officer 1)
 *     eo2@ekibbo.co         EXTENSION_OFFICER → EKB_EXTENSION  (Extension Officer 2)
 *
 *   Each new role has a tailored permission set in src/lib/permissions.ts
 *   and a tailored dashboard in src/components/dashboard/EkbiboDashboards.tsx.
 *
 * Usage:
 *   npx tsx scripts/migrate-ekibbo-roles.ts
 *
 * Safe to re-run — matches users by email and updates their role only if it
 * has changed. Prints a summary at the end.
 *
 * PREREQUISITES:
 *   1. You have a .env file in the project root with DATABASE_URL set
 *      (pointing to the DB you want to migrate — local or production).
 *   2. You have tsx installed: npm install -D tsx  (or use npx tsx)
 *   3. You have run the latest code (git pull) so the new EKB_* roles
 *      exist in src/lib/permissions.ts and the new dashboards exist in
 *      src/components/dashboard/EkbiboDashboards.tsx.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const EKIBBO_TENANT_NAME = 'EKIBBO Coffee Exporters'

interface Migration {
  email: string
  oldRole: string
  newRole: string
  label: string
}

const MIGRATIONS: Migration[] = [
  { email: 'eric@ekibbo.co',      oldRole: 'TENANT_ADMIN',      newRole: 'EKB_MD',             label: 'Managing Director' },
  { email: 'ops@ekibbo.co',       oldRole: 'TENANT_ADMIN',      newRole: 'EKB_OPS_MANAGER',    label: 'Operations Manager' },
  { email: 'finance@ekibbo.co',   oldRole: 'TENANT_ADMIN',      newRole: 'EKB_FINANCE',        label: 'Finance Officer' },
  { email: 'assistant@ekibbo.co', oldRole: 'AGENT',             newRole: 'EKB_FIN_ASSISTANT',  label: 'Finance & Ops Assistant' },
  { email: 'mec@ekibbo.co',       oldRole: 'CBT',               newRole: 'EKB_MEC',            label: 'M, E & C Officer' },
  { email: 'eo1@ekibbo.co',       oldRole: 'EXTENSION_OFFICER', newRole: 'EKB_EXTENSION',      label: 'Extension Officer 1' },
  { email: 'eo2@ekibbo.co',       oldRole: 'EXTENSION_OFFICER', newRole: 'EKB_EXTENSION',      label: 'Extension Officer 2' },
]

async function main() {
  console.log('🔄 EKIBBO Role Migration')
  console.log('='.repeat(60))

  // Find the EKIBBO tenant (just for context — we match users by email globally).
  const tenant = await db.tenant.findFirst({
    where: { name: { contains: 'EKIBBO' } },
    select: { id: true, name: true },
  })

  if (!tenant) {
    console.error('❌ EKIBBO tenant not found — aborting.')
    console.error('   Make sure your DATABASE_URL points to a database that has the EKIBBO tenant.')
    process.exit(1)
  }

  console.log(`\n📋 Tenant: ${tenant.name} (${tenant.id})`)
  console.log(`   Migrating ${MIGRATIONS.length} user accounts...\n`)

  let updated = 0
  let skipped = 0
  let notFound = 0

  for (const m of MIGRATIONS) {
    const user = await db.user.findFirst({
      where: { email: m.email },
      select: { id: true, role: true, firstName: true, lastName: true, tenantId: true },
    })

    if (!user) {
      console.log(`   ⚠️  NOT FOUND       ${m.email.padEnd(28)} (skipped)`)
      notFound++
      continue
    }

    // Sanity check — make sure the user is actually attached to the EKIBBO tenant.
    if (user.tenantId !== tenant.id) {
      console.log(`   ⚠️  TENANT MISMATCH  ${m.email.padEnd(28)} (tenantId=${user.tenantId}, expected ${tenant.id})`)
    }

    if (user.role === m.newRole) {
      console.log(`   ✓  ALREADY MIGRATED ${m.email.padEnd(28)} role=${m.newRole} (${m.label})`)
      skipped++
      continue
    }

    await db.user.update({
      where: { id: user.id },
      data: { role: m.newRole },
    })

    const wasRole = user.role || '(none)'
    console.log(`   ✅ MIGRATED         ${m.email.padEnd(28)} ${wasRole.padEnd(20)} → ${m.newRole.padEnd(20)} (${m.label})`)
    updated++
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Migration complete')
  console.log('='.repeat(60))
  console.log(`   Migrated:     ${updated}`)
  console.log(`   Already done: ${skipped}`)
  console.log(`   Not found:    ${notFound}`)
  console.log(`   Total:        ${MIGRATIONS.length}`)

  if (updated > 0) {
    console.log('\n📋 Post-migration role assignments:')
    for (const m of MIGRATIONS) {
      console.log(`   ${m.newRole.padEnd(20)} | ${m.email.padEnd(28)} | ${m.label}`)
    }
    console.log('\n💡 Users should log out and log back in for the new role to take effect.')
    console.log('   Each role now sees a tailored dashboard and only the menus they need.')
  }
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => db.$disconnect())
