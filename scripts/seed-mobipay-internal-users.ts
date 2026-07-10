/**
 * Seed: Create MobiPay internal team user accounts
 * Run: npx tsx scripts/seed-mobipay-internal-users.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

const INTERNAL_USERS = [
  {
    email: 'finance@mobipay.agrosys.com',
    role: 'MOBIPAY_FINANCE',
    firstName: 'Finance',
    lastName: 'Team',
    phone: '+256700000099',
    description: 'Billing operations, invoices, quotes, payment monitoring',
  },
  {
    email: 'support@mobipay.agrosys.com',
    role: 'MOBIPAY_SUPPORT',
    firstName: 'Support',
    lastName: 'Team',
    phone: '+256700000098',
    description: 'Support tickets — responds to tenant issues',
  },
]

async function main() {
  console.log('👤 Seeding MobiPay Internal Team Users')
  console.log('='.repeat(60))

  const tenant = await db.tenant.findFirst({
    where: { type: 'SUPER_ADMIN' },
    select: { id: true, name: true },
  })

  if (!tenant) {
    console.error('❌ No SUPER_ADMIN tenant found.')
    process.exit(1)
  }

  console.log(`\n📋 Tenant: ${tenant.name} (${tenant.id})`)

  const password = 'password123'
  const passwordHash = await bcrypt.hash(password, 12)

  for (const u of INTERNAL_USERS) {
    const existing = await db.user.findFirst({ where: { email: u.email } })

    if (existing) {
      await db.user.update({
        where: { id: existing.id },
        data: { role: u.role, passwordHash, isActive: true, tenantId: tenant.id,
          firstName: u.firstName, lastName: u.lastName, phone: u.phone },
      })
      console.log(`\n↻ Updated: ${u.email} → role: ${u.role}`)
    } else {
      await db.user.create({
        data: { email: u.email, passwordHash, role: u.role, isActive: true, tenantId: tenant.id,
          firstName: u.firstName, lastName: u.lastName, phone: u.phone },
      })
      console.log(`\n✅ Created: ${u.email} → role: ${u.role}`)
    }

    console.log(`   ${u.description}`)
  }

  console.log('\n📋 Login Credentials:')
  console.log('   ────────────────────────────────────────────')
  for (const u of INTERNAL_USERS) {
    console.log(`   ${u.role.padEnd(20)} | ${u.email.padEnd(35)} | password123`)
  }
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
