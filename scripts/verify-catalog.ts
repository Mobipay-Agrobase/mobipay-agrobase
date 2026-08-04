import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true })

async function main() {
  const db = new PrismaClient()
  const sample = await db.catalogMaster.groupBy({
    by: ['category'],
    _count: { value: true },
    orderBy: { category: 'asc' },
  })
  console.log('Categories:', sample.length)
  for (const s of sample) console.log('  ' + s.category + ': ' + s._count.value)
  const total = await db.catalogMaster.count()
  console.log('Total:', total)
  await db.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
