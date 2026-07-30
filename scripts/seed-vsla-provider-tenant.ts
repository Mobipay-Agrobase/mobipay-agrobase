/**
 * P3 Seed Script — Seed a VSLA_PROVIDER standalone tenant + an admin user + module entitlements.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... npx tsx scripts/seed-vsla-provider-tenant.ts
 *
 * What it does:
 *   1. Creates (or finds) a VSLA_PROVIDER tenant named "Agrobase VSLA" (Uganda, UGX).
 *   2. Creates a VSLA_PROVIDER_ADMIN user on that tenant (email: vsla-admin@agrobase.co, pw: password123).
 *   3. Grants the VSLA module entitlement to the new tenant.
 *   4. Writes an AuditLog entry with action='VSLA_PROVIDER_TENANT_SEED'.
 *
 * Idempotent: re-running on a DB that already has the tenant + user is a no-op.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

const TENANT_NAME = 'Agrobase VSLA'
const TENANT_TYPE = 'VSLA_PROVIDER'
const TENANT_COUNTRY = 'Uganda'
const TENANT_CURRENCY = 'UGX'

const ADMIN_EMAIL = 'vsla-admin@agrobase.co'
const ADMIN_PHONE = '+256700099900'
const ADMIN_PASSWORD = 'password123'
const ADMIN_FIRST = 'VSLA'
const ADMIN_LAST = 'Administrator'

// Modules a VSLA_PROVIDER tenant needs. VSLA is the core; the others are
// supporting modules the VSLA_PROVIDER_ADMIN role has read/create on.
const ENTITLED_MODULES = [
  'DASHBOARD', 'FARMERS', 'VSLA', 'REPORTS', 'TRAINING', 'COMMUNICATION', 'SURVEYS',
]

async function main() {
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('  P3 Seed: VSLA_PROVIDER Standalone Tenant')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('')

  // ─── 1. Find or create the tenant ────────────────────────────────────────
  console.log('▶ Step 1: Find or create VSLA_PROVIDER tenant...')
  let tenant = await db.tenant.findFirst({
    where: { type: TENANT_TYPE, name: TENANT_NAME },
  })

  if (tenant) {
    console.log(`  ✓ Existing tenant: ${tenant.name} (${tenant.id}) — type=${tenant.type}, active=${tenant.isActive}`)
  } else {
    tenant = await db.tenant.create({
      data: {
        name: TENANT_NAME,
        type: TENANT_TYPE,
        country: TENANT_COUNTRY,
        defaultCurrency: TENANT_CURRENCY,
        isActive: true,
      },
    })
    console.log(`  ✓ Created new tenant: ${tenant.name} (${tenant.id})`)
  }
  console.log('')

  // ─── 2. Find or create the admin user ────────────────────────────────────
  console.log('▶ Step 2: Find or create VSLA_PROVIDER_ADMIN user...')
  let admin = await db.user.findFirst({
    where: {
      OR: [
        { email: ADMIN_EMAIL },
        { phone: ADMIN_PHONE },
      ],
    },
  })

  if (admin) {
    console.log(`  ✓ Existing user: ${admin.email || admin.phone} (${admin.id}) — role=${admin.role}`)
    // If the user exists but has a different role/tenant, log a warning but don't overwrite.
    if (admin.role !== 'VSLA_PROVIDER_ADMIN' || admin.tenantId !== tenant.id) {
      console.warn(`  ⚠ WARNING: Existing user has role=${admin.role}, tenantId=${admin.tenantId}.`)
      console.warn('    This seed script will NOT overwrite the existing user. Delete it manually if you want to re-seed.')
    }
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
    admin = await db.user.create({
      data: {
        tenantId: tenant.id,
        role: 'VSLA_PROVIDER_ADMIN',
        email: ADMIN_EMAIL,
        phone: ADMIN_PHONE,
        passwordHash,
        firstName: ADMIN_FIRST,
        lastName: ADMIN_LAST,
        isActive: true,
      },
    })
    console.log(`  ✓ Created new user: ${admin.email} (${admin.id})`)
    console.log(`    Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
  }
  console.log('')

  // ─── 3. Grant module entitlements ────────────────────────────────────────
  console.log('▶ Step 3: Grant module entitlements...')
  let grantedCount = 0
  let existingCount = 0
  for (const moduleCode of ENTITLED_MODULES) {
    const existing = await db.moduleEntitlement.findUnique({
      where: { tenantId_moduleCode: { tenantId: tenant.id, moduleCode } },
    })
    if (existing) {
      if (!existing.isEnabled) {
        await db.moduleEntitlement.update({
          where: { id: existing.id },
          data: { isEnabled: true },
        })
        console.log(`  ✓ Re-enabled: ${moduleCode}`)
        grantedCount++
      } else {
        existingCount++
      }
    } else {
      await db.moduleEntitlement.create({
        data: { tenantId: tenant.id, moduleCode, isEnabled: true },
      })
      console.log(`  ✓ Granted: ${moduleCode}`)
      grantedCount++
    }
  }
  console.log(`  ${existingCount} entitlement(s) already in place, ${grantedCount} new/re-enabled.`)
  console.log('')

  // ─── 4. AuditLog ─────────────────────────────────────────────────────────
  console.log('▶ Step 4: Write AuditLog entry...')
  const superAdmin = await db.user.findFirst({
    where: { role: 'SUPER_ADMIN', isActive: true },
    select: { id: true },
  })
  if (superAdmin) {
    await db.auditLog.create({
      data: {
        userId: superAdmin.id,
        action: 'VSLA_PROVIDER_TENANT_SEED',
        entityType: 'Tenant',
        entityId: tenant.id,
        details: JSON.stringify({
          tenantName: tenant.name,
          tenantType: tenant.type,
          adminUserId: admin.id,
          adminEmail: admin.email,
          adminRole: admin.role,
          entitledModules: ENTITLED_MODULES,
        }),
      },
    })
    console.log('  ✓ AuditLog entry written')
  } else {
    console.warn('  ⚠ No SUPER_ADMIN user found — AuditLog entry skipped (non-fatal).')
  }
  console.log('')

  // ─── 5. Summary ──────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('  ✓ SEED COMPLETE')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log(`  Tenant: ${tenant.name} (${tenant.id})`)
  console.log(`  Type:   ${tenant.type}`)
  console.log(`  Admin:  ${admin.email} (role=${admin.role})`)
  console.log(`  Login:  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
  console.log('')
}

main()
  .catch((err) => {
    console.error('')
    console.error('❌ Seed failed:', err.message)
    console.error('')
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
