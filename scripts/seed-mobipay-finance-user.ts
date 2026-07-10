/**
 * Seed: Create the MobiPay Finance team user account
 * Run: npx tsx scripts/seed-mobipay-finance-user.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('👤 Seeding MobiPay Finance Team User')
  console.log('='.repeat(60))

  // Find the MobiPay HQ tenant (SUPER_ADMIN tenant)
  const tenant = await db.tenant.findFirst({
    where: { type: 'SUPER_ADMIN' },
    select: { id: true, name: true },
  })

  if (!tenant) {
    console.error('❌ No SUPER_ADMIN tenant found — create one first.')
    process.exit(1)
  }

  console.log(`\n📋 Tenant: ${tenant.name} (${tenant.id})`)

  const email = 'finance@mobipay.agrosys.com'
  const password = 'password123'
  const passwordHash = await bcrypt.hash(password, 12)

  const existing = await db.user.findFirst({ where: { email } })

  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: { role: 'MOBIPAY_FINANCE', passwordHash, isActive: true, tenantId: tenant.id,
        firstName: 'Finance', lastName: 'Team' },
    })
    console.log(`\n↻ Updated: ${email} → role: MOBIPAY_FINANCE`)
  } else {
    await db.user.create({
      data: {
        email, passwordHash, role: 'MOBIPAY_FINANCE', isActive: true, tenantId: tenant.id,
        firstName: 'Finance', lastName: 'Team',
        phone: '+256700000099',
      },
    })
    console.log(`\n✅ Created: ${email} → role: MOBIPAY_FINANCE`)
  }

  console.log('\n📋 Login Credentials:')
  console.log(`   Email: ${email}`)
  console.log(`   Password: ${password}`)
  console.log('\n   This user sees ONLY billing-related menus:')
  console.log('   • Dashboard')
  console.log('   • Billing Operations (all tenants)')
  console.log('   • Platform Recovery')
  console.log('   • Billing & Usage')
  console.log('   • Profile')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
