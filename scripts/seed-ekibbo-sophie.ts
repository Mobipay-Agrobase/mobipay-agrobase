/**
 * Seed: Create Sophie as EKB_MD for EKIBBO
 * Run: npx tsx scripts/seed-ekibbo-sophie.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('Creating Sophie (EKB_MD) for EKIBBO')
  console.log('='.repeat(60))

  const ekibbo = await db.tenant.findFirst({
    where: { name: { contains: 'EKIBBO' } },
    select: { id: true, name: true },
  })

  if (!ekibbo) {
    console.error('EKIBBO tenant not found')
    process.exit(1)
  }

  const email = 'sophie@ekibbo.com'
  const password = 'password123'
  const passwordHash = await bcrypt.hash(password, 12)

  const existing = await db.user.findFirst({ where: { email } })

  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: {
        role: 'EKB_MD',
        passwordHash,
        isActive: true,
        tenantId: ekibbo.id,
        firstName: 'Sophie',
        lastName: 'Ekibbo',
      },
    })
    console.log(`Updated: ${email} -> EKB_MD`)
  } else {
    await db.user.create({
      data: {
        email,
        passwordHash,
        role: 'EKB_MD',
        isActive: true,
        tenantId: ekibbo.id,
        firstName: 'Sophie',
        lastName: 'Ekibbo',
        phone: '+256785122115',
      },
    })
    console.log(`Created: ${email} -> EKB_MD`)
  }

  console.log('\nLogin Credentials:')
  console.log(`   Email: ${email}`)
  console.log(`   Password: ${password}`)
  console.log(`   Role: EKB_MD (Managing Director - full access)`)
  console.log(`   Tenant: ${ekibbo.name}`)
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => db.$disconnect())
