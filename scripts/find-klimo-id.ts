import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const k = await db.tenant.findFirst({ where: { name: { contains: 'limo' } } })
  if (!k) { console.log('NOT FOUND'); return }
  console.log('ID:', k.id)
  console.log('Name:', k.name)
  console.log('Country:', k.country)
  console.log('Status:', (k as any).status || (k as any).isActive)
  const users = await db.user.findMany({ where: { tenantId: k.id } })
  console.log(`\nUsers on ${k.name}:`)
  for (const u of users) {
    console.log(`  ${u.email} | ${u.role} | ${u.firstName} ${u.lastName} | active=${u.isActive}`)
  }
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
