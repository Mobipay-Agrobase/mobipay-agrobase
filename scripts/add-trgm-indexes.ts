/**
 * Create pg_trgm GIN indexes to accelerate `contains` (LIKE '%term%')
 * case-insensitive searches on the list-view text columns.
 *
 * A normal btree index cannot speed up a leading-wildcard LIKE ('%term%')
 * query, but a pg_trgm GIN index can. This runs once (idempotent via IF NOT
 * EXISTS) and Prisma `db push` leaves hand-created indexes untouched.
 *
 * Run: npx tsx scripts/add-trgm-indexes.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const INDEXES: { name: string; table: string; column: string }[] = [
  // Farmer search
  { name: 'idx_farmers_first_name_trgm', table: 'FarmerProfile', column: 'firstName' },
  { name: 'idx_farmers_last_name_trgm', table: 'FarmerProfile', column: 'lastName' },
  { name: 'idx_farmers_phone_trgm', table: 'FarmerProfile', column: 'phone' },
  { name: 'idx_farmers_farmer_code_trgm', table: 'FarmerProfile', column: 'farmerCode' },
  // Farm land search
  { name: 'idx_farm_land_name_trgm', table: 'FarmLand', column: 'name' },
  // Cultivation search
  { name: 'idx_cultivation_crop_name_trgm', table: 'Cultivation', column: 'cropName' },
  { name: 'idx_cultivation_variety_trgm', table: 'Cultivation', column: 'variety' },
]

async function main() {
  console.log('Enabling pg_trgm extension...')
  await db.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm')

  for (const ix of INDEXES) {
    const sql = `
      CREATE INDEX IF NOT EXISTS "${ix.name}"
      ON "${ix.table}" USING GIN ("${ix.column}" gin_trgm_ops)`
    try {
      await db.$executeRawUnsafe(sql)
      console.log(`  ✅ ${ix.name}`)
    } catch (e) {
      console.log(`  ⚠️  ${ix.name}: ${(e as Error).message.slice(0, 120)}`)
    }
  }

  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())