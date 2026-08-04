/**
 * Update NSSF config: min contribution UGX 1,000 (per NSSF document)
 * Run: npx tsx scripts/update-nssf-config.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('Updating NSSF config (min contribution = UGX 1,000)...')
  
  const result = await db.moduleEntitlement.updateMany({
    where: { moduleCode: 'NSSF' },
    data: {
      config: JSON.stringify({
        commissionRate: 0.30,
        mobipayShare: 0.50,
        klimotrustShare: 0.50,
        minContribution: 1000,
        maxContribution: null,
        settlementCycle: 'WEEKLY',
      }),
    },
  })
  
  console.log(`✅ Updated ${result.count} NSSF module config(s)`)
  console.log('   Min contribution: UGX 1,000')
  console.log('   Commission: 30%')
  console.log('   Split: 50/50 (placeholder)')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
