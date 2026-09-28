import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  console.log('DB provider test...')
  const tables: any[] = await db.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name ILIKE '%farmer%'
    ORDER BY table_name;
  `)
  console.log('Farmer-related tables:')
  for (const t of tables) {
    console.log(`  ${t.table_name}`)
  }
  console.log('\nFinding duplicate (tenantId, phone) pairs...')
  const dupes: any[] = await db.$queryRawUnsafe(`
    SELECT "tenantId", phone, COUNT(*) as cnt
    FROM "FarmerProfile"
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY "tenantId", phone
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
    LIMIT 30;
  `)
  console.log(`Found ${dupes.length} duplicate phone pairs:`)
  for (const d of dupes) {
    console.log(`  tenant=${d.tenantId} | phone=${d.phone} | count=${d.cnt}`)
  }
  const total = await db.farmerProfile.count()
  console.log(`\nTotal farmers: ${total}`)
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
