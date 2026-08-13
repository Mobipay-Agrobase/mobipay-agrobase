import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true })

async function main() {
  const db = new PrismaClient()
  const cats = ['bank_uganda', 'insurance_company_uganda', 'asset_type', 'animal_for_growth', 'produce_type', 'input_type', 'sale_category']
  for (const c of cats) {
    const rows = await db.catalogMaster.findMany({ where: { category: c }, select: { value: true } })
    console.log(c + ':', rows.length, 'values —', rows.slice(0, 5).map(r => r.value).join(', ') + (rows.length > 5 ? '...' : ''))
  }
  await db.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
