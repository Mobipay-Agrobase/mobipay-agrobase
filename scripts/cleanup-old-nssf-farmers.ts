import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// The Klimotrust tenant ID on production Neon DB
const KILIMOTRUST_TENANT_ID = 'cmrfysam700000z4ur22vo6xz'

/**
 * Deletes all FarmerProfile records on the Klimotrust (NSSF) tenant that were
 * created before the cutoff date (2 days ago from now).
 *
 * This is a one-time cleanup script to remove old seed/test data that was
 * accidentally created during development before the NSSF go-live.
 *
 * Run: npx tsx scripts/cleanup-old-nssf-farmers.ts
 *
 * Safety: this script ONLY deletes farmers on the Klimotrust tenant — it
 * will NOT touch farmers on other tenants (EKiBBO, ZIWA360, Agrotel, etc.).
 */
async function main() {
  const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)  // 2 days ago
  console.log('🧹 Cleaning up old NSSF farmer records')
  console.log('='.repeat(60))
  console.log(`Tenant: Klimotrust (${KILIMOTRUST_TENANT_ID})`)
  console.log(`Cutoff: ${cutoff.toISOString()} (records created BEFORE this date will be deleted)`)
  console.log('')

  // First, count how many records will be deleted (dry run)
  const count = await db.farmerProfile.count({
    where: {
      tenantId: KILIMOTRUST_TENANT_ID,
      createdAt: { lt: cutoff },
    },
  })

  if (count === 0) {
    console.log('✅ No old records found — nothing to delete.')
    return
  }

  console.log(`Found ${count} farmer record(s) created before ${cutoff.toISOString()}`)
  console.log('')

  // Show the records that will be deleted (for audit purposes)
  const records = await db.farmerProfile.findMany({
    where: {
      tenantId: KILIMOTRUST_TENANT_ID,
      createdAt: { lt: cutoff },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      nssfNationalId: true,
      createdAt: true,
      enrolledByOfficerId: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  console.log('Records to be deleted:')
  for (const r of records) {
    console.log(`  ${r.id} | ${r.firstName} ${r.lastName} | phone=${r.phone} | NIN=${r.nssfNationalId || '—'} | created=${r.createdAt.toISOString()}`)
  }
  console.log('')

  // ─── Cascade-delete related records FIRST ───
  // The FarmerProfile has foreign key constraints from:
  //   - NssfRegistration (farmerId)
  //   - NssfContribution (farmerId)
  // We need to delete these related records first, then delete the farmers.

  // Get the list of farmer IDs to delete
  const farmerIds = records.map(r => r.id)

  // 1. Delete NSSF contributions linked to these farmers
  const contribResult = await db.nssfContribution.deleteMany({
    where: { farmerId: { in: farmerIds } },
  })
  console.log(`  Deleted ${contribResult.count} NSSF contribution(s)`)

  // 2. Delete NSSF registrations linked to these farmers
  const regResult = await db.nssfRegistration.deleteMany({
    where: { farmerId: { in: farmerIds } },
  })
  console.log(`  Deleted ${regResult.count} NSSF registration(s)`)

  // 3. Now delete the farmers
  const result = await db.farmerProfile.deleteMany({
    where: {
      tenantId: KILIMOTRUST_TENANT_ID,
      createdAt: { lt: cutoff },
    },
  })

  console.log(`✅ Deleted ${result.count} farmer record(s) from the Klimotrust tenant.`)
  console.log('')

  // Verify remaining count
  const remaining = await db.farmerProfile.count({
    where: { tenantId: KILIMOTRUST_TENANT_ID },
  })
  console.log(`Remaining farmers on Klimotrust tenant: ${remaining}`)
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => db.$disconnect())
