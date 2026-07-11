/**
 * Cleanup: Deactivate Ghana and Kenya demo tenants + their users
 * Run: npx tsx scripts/cleanup-demo-tenants.ts
 *
 * This script:
 *   1. Deactivates (does NOT delete) Ghana and Kenya tenants
 *   2. Deactivates all users belonging to those tenants
 *   3. Keeps EKIBBO, MobiPay (SUPER_ADMIN), and any other active tenants
 *
 * Data is NOT deleted — only marked isActive=false. This is safer for
 * audit trail purposes. If you need to permanently delete, do it manually
 * after confirming with Eric.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🧹 Platform Cleanup — Removing Demo Tenants')
  console.log('='.repeat(60))

  // Find Ghana and Kenya tenants
  const demoTenants = await db.tenant.findMany({
    where: {
      OR: [
        { name: { contains: 'Ghana' } },
        { name: { contains: 'Kenya' } },
        { country: { in: ['Ghana', 'Kenya'] } },
      ],
      type: { not: 'SUPER_ADMIN' },
    },
    select: { id: true, name: true, country: true, type: true, _count: { select: { users: true, farmerProfiles: true } } },
  })

  if (demoTenants.length === 0) {
    console.log('\n✅ No Ghana/Kenya demo tenants found — nothing to clean up.')
    
    // Also check for demo Uganda tenants (ug.admin, ug.tenant, etc.)
    const ugDemoUsers = await db.user.findMany({
      where: { email: { startsWith: 'ug.' } },
      select: { id: true, email: true, role: true, isActive: true },
    })
    
    if (ugDemoUsers.length > 0) {
      console.log(`\n⚠️  Found ${ugDemoUsers.length} demo Uganda users (ug.*@agrobase.co)`)
      console.log('   Deactivating...')
      for (const u of ugDemoUsers) {
        await db.user.update({ where: { id: u.id }, data: { isActive: false } })
        console.log(`   ✓ Deactivated: ${u.email}`)
      }
    }
    
    // Check for Ghana/Kenya demo users
    const ghKeUsers = await db.user.findMany({
      where: { OR: [{ email: { startsWith: 'gh.' } }, { email: { startsWith: 'ke.' } }] },
      select: { id: true, email: true, role: true, isActive: true },
    })
    
    if (ghKeUsers.length > 0) {
      console.log(`\n⚠️  Found ${ghKeUsers.length} Ghana/Kenya demo users`)
      console.log('   Deactivating...')
      for (const u of ghKeUsers) {
        await db.user.update({ where: { id: u.id }, data: { isActive: false } })
        console.log(`   ✓ Deactivated: ${u.email}`)
      }
    }

    // Check for Hope Finance MFI demo
    const mfiUsers = await db.user.findMany({
      where: { email: { contains: 'hopefinance' } },
      select: { id: true, email: true },
    })
    if (mfiUsers.length > 0) {
      console.log(`\n⚠️  Found ${mfiUsers.length} Hope Finance MFI demo users`)
      for (const u of mfiUsers) {
        await db.user.update({ where: { id: u.id }, data: { isActive: false } })
        console.log(`   ✓ Deactivated: ${u.email}`)
      }
    }

    // Check for exporter.agent@ekibbo.co (old demo)
    const oldEkibbo = await db.user.findMany({
      where: { email: 'exporter@ekibbo.co' },
      select: { id: true, email: true },
    })
    if (oldEkibbo.length > 0) {
      console.log(`\n⚠️  Found old exporter@ekibbo.co demo user — deactivating`)
      for (const u of oldEkibbo) {
        await db.user.update({ where: { id: u.id }, data: { isActive: false } })
        console.log(`   ✓ Deactivated: ${u.email}`)
      }
    }

    console.log('\n✅ Cleanup complete.')
    return
  }

  console.log(`\n📋 Found ${demoTenants.length} demo tenant(s) to deactivate:`)
  for (const t of demoTenants) {
    console.log(`   • ${t.name} (${t.country}) — ${t._count.users} users, ${t._count.farmerProfiles} farmers`)
  }

  // Deactivate each tenant + its users
  for (const t of demoTenants) {
    console.log(`\n🔧 Deactivating: ${t.name}`)
    
    // Deactivate the tenant
    await db.tenant.update({
      where: { id: t.id },
      data: { isActive: false },
    })
    console.log(`   ✓ Tenant deactivated`)

    // Deactivate all users
    const result = await db.user.updateMany({
      where: { tenantId: t.id },
      data: { isActive: false },
    })
    console.log(`   ✓ ${result.count} user(s) deactivated`)
  }

  // Also deactivate any standalone demo users (ug.*, gh.*, ke.*)
  const demoEmails = await db.user.findMany({
    where: {
      OR: [
        { email: { startsWith: 'ug.' } },
        { email: { startsWith: 'gh.' } },
        { email: { startsWith: 'ke.' } },
        { email: { contains: 'hopefinance' } },
        { email: 'exporter@ekibbo.co' },
      ],
      isActive: true,
    },
    select: { id: true, email: true },
  })

  if (demoEmails.length > 0) {
    console.log(`\n🔧 Deactivating ${demoEmails.length} standalone demo user(s):`)
    for (const u of demoEmails) {
      await db.user.update({ where: { id: u.id }, data: { isActive: false } })
      console.log(`   ✓ ${u.email}`)
    }
  }

  // Summary of what's still active
  const activeTenants = await db.tenant.findMany({
    where: { isActive: true },
    select: { name: true, country: true, type: true, _count: { select: { users: true } } },
    orderBy: { name: 'asc' },
  })

  console.log('\n' + '='.repeat(60))
  console.log('✅ Cleanup complete')
  console.log('='.repeat(60))
  console.log(`\n📋 Active tenants after cleanup (${activeTenants.length}):`)
  for (const t of activeTenants) {
    console.log(`   • ${t.name} (${t.country || '—'}) — ${t.type} — ${t._count.users} active users`)
  }
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => db.$disconnect())
