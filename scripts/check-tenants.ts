import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env'), override: true })

async function main() {
  const db = new PrismaClient()

  console.log('=== EKIBBO Tenant Users ===')
  const ekibboTenant = await db.tenant.findFirst({ where: { name: 'EKIBBO Coffee Exporters' } })
  if (ekibboTenant) {
    const users = await db.user.findMany({
      where: { tenantId: ekibboTenant.id },
      select: { id: true, email: true, role: true, isActive: true, firstName: true, lastName: true, phone: true, passwordHash: true },
    })
    for (const u of users) {
      console.log(`  ${u.email} | role: ${u.role} | active: ${u.isActive} | name: ${u.firstName} ${u.lastName} | phone: ${u.phone} | hasPassword: ${!!u.passwordHash}`)
    }
  }

  console.log('\n=== Ghana + Kenya Tenants ===')
  const ghanaTenant = await db.tenant.findFirst({ where: { name: 'Agrobase Ghana' } })
  const kenyaTenant = await db.tenant.findFirst({ where: { name: 'Agrobase Kenya' } })
  for (const t of [ghanaTenant, kenyaTenant]) {
    if (!t) continue
    console.log(`\n  Tenant: ${t.name} (${t.id})`)
    const [users, farmers, farmLands, vslaGroups] = await Promise.all([
      db.user.count({ where: { tenantId: t.id } }),
      db.farmerProfile.count({ where: { tenantId: t.id } }),
      db.farmLand.count({ where: { farmer: { tenantId: t.id } } }),
      db.vslaGroup.count({ where: { tenantId: t.id } }),
    ])
    console.log(`    Users: ${users}, Farmers: ${farmers}, FarmLands: ${farmLands}, VSLA Groups: ${vslaGroups}`)
  }

  console.log('\n=== All Tenants ===')
  const allTenants = await db.tenant.findMany({ select: { id: true, name: true, type: true, isActive: true, country: true } })
  for (const t of allTenants) {
    console.log(`  ${t.name} | type: ${t.type} | active: ${t.isActive} | country: ${t.country || '—'}`)
  }

  await db.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
