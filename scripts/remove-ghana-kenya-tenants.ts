/**
 * Remove Ghana + Kenya tenants and their demo users.
 * These tenants have 0 farmers, 0 farm lands, 0 VSLA groups — only demo
 * users from seed-users.ts. Safe to delete entirely.
 *
 * Also deactivates Green Valley NGO (Kenya) + Tropical Agribusiness Ltd (Ghana)
 * if they have any users.
 *
 * Usage: npx tsx scripts/remove-ghana-kenya-tenants.ts
 */
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env'), override: true })

const db = new PrismaClient()

async function main() {
  const tenantsToRemove = [
    'Agrobase Ghana',
    'Agrobase Kenya',
    'Green Valley NGO',        // Kenya
    'Tropical Agribusiness Ltd', // Ghana
  ]

  for (const tenantName of tenantsToRemove) {
    const tenant = await db.tenant.findFirst({ where: { name: tenantName } })
    if (!tenant) {
      console.log(`⏭️  Tenant "${tenantName}" not found — skipping`)
      continue
    }

    // Count records before deletion
    const [users, farmers, farmLands, vslaGroups, payments] = await Promise.all([
      db.user.count({ where: { tenantId: tenant.id } }),
      db.farmerProfile.count({ where: { tenantId: tenant.id } }),
      db.farmLand.count({ where: { farmer: { tenantId: tenant.id } } }),
      db.vslaGroup.count({ where: { tenantId: tenant.id } }),
      db.payment.count({ where: { paymentAccount: { tenantId: tenant.id } } }),
    ])

    console.log(`\n📋 ${tenantName} (${tenant.id})`)
    console.log(`   Users: ${users}, Farmers: ${farmers}, FarmLands: ${farmLands}, VSLA Groups: ${vslaGroups}, Payments: ${payments}`)

    if (farmers > 0 || farmLands > 0 || vslaGroups > 0 || payments > 0) {
      console.log(`   ⚠️  Has real data — deactivating instead of deleting`)
      await db.tenant.update({ where: { id: tenant.id }, data: { isActive: false } })
      console.log(`   ✅ Deactivated`)
      continue
    }

    // Safe to clean: only demo users exist (no farmers/farmLands/VSLAs)
    // Delete users, then deactivate the tenant (can't delete tenant row
    // because of FK constraints from CropCalendar and other reference tables)
    const deletedUsers = await db.user.deleteMany({ where: { tenantId: tenant.id } })
    console.log(`   🗑️  Deleted ${deletedUsers.count} users`)

    await db.tenant.update({ where: { id: tenant.id }, data: { isActive: false } })
    console.log(`   ✅ Tenant deactivated (FK constraints prevent row deletion)`)
  }

  // Verify remaining tenants
  console.log('\n✅ Remaining active tenants:')
  const remaining = await db.tenant.findMany({
    where: { isActive: true },
    select: { name: true, type: true, country: true },
    orderBy: { name: 'asc' },
  })
  for (const t of remaining) {
    console.log(`   ${t.name} | ${t.type} | ${t.country || '—'}`)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
