import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  console.log('=== ALL TENANTS ===')
  const tenants: any[] = await db.tenant.findMany({ orderBy: { name: 'asc' } })
  for (const t of tenants) {
    console.log(`${t.id} | ${t.name} | ${t.plan || '-'} | ${t.country || '-'} | status=${t.status || '?'}`)
  }
  console.log('\n=== USERS WITH NSSF / KILIMO / EXTENSION ===')
  const users: any[] = await db.user.findMany({
    where: {
      OR: [
        { email: { contains: 'klimo' } },
        { email: { contains: 'nssf' } },
        { email: { contains: 'extension' } },
        { role: 'EXTENSION_OFFICER' },
      ]
    },
    include: { tenant: { select: { name: true } } }
  })
  for (const u of users) {
    console.log(`${u.email || u.phone} | ${u.role} | ${u.firstName} ${u.lastName} | tenant=${u.tenant?.name || '?'} | active=${u.isActive}`)
  }
  console.log(`\n=== TOTAL: ${tenants.length} tenants, ${users.length} NSSF/extension users ===`)
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
