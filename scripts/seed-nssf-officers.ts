import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const KILIMO_TENANT_ID = 'cmrfysam700000z4ur22vo6xz'

const OFFICERS = [
  { email: 'officer1@kilimo.org', firstName: 'John',    lastName: 'Mukasa',     phone: '+256711000001' },
  { email: 'officer2@kilimo.org', firstName: 'Sarah',   lastName: 'Nakato',     phone: '+256711000002' },
  { email: 'officer3@kilimo.org', firstName: 'David',   lastName: 'Okello',     phone: '+256711000003' },
  { email: 'officer4@kilimo.org', firstName: 'Grace',   lastName: 'Akello',     phone: '+256711000004' },
  { email: 'officer5@kilimo.org', firstName: 'Patrick', lastName: 'Byaruhanga', phone: '+256711000005' },
]
const ADMIN_PHONE = '+256711000000'

async function main() {
  console.log('🌱 Seeding NSSF Officers on Klimotrust tenant')
  console.log('='.repeat(60))

  const tenant = await db.tenant.findUnique({ where: { id: KILIMO_TENANT_ID } })
  if (!tenant) { console.error('Tenant not found'); process.exit(1) }
  console.log(`✓ Tenant: ${tenant.name}`)

  // Borrow the password hash from an existing user (all demo users use 'password123')
  const ref = await db.user.findFirst({ where: { email: 'admin@klimotrust.org' }, select: { passwordHash: true } })
  if (!ref?.passwordHash) { console.error('No reference user found'); process.exit(1) }
  const passwordHash = ref.passwordHash
  console.log(`✓ Using password hash from admin@klimotrust.org (password: password123)`)

  // ─── 1. NSSF Admin ───
  console.log('\n1. Creating NSSF Admin...')
  const adminEmail = 'nssf-admin@kilimo.org'
  let admin = await db.user.findFirst({ where: { email: adminEmail } })
  if (admin) {
    admin = await db.user.update({
      where: { id: admin.id },
      data: { role: 'TENANT_ADMIN', passwordHash, isActive: true, tenantId: KILIMO_TENANT_ID, firstName: 'NSSF', lastName: 'Admin', phone: ADMIN_PHONE }
    })
    console.log(`   ↻ Updated admin: ${admin.email} → TENANT_ADMIN`)
  } else {
    // Try to create — if phone collides, find by phone and update email
    try {
      admin = await db.user.create({
        data: { email: adminEmail, passwordHash, role: 'TENANT_ADMIN', isActive: true, tenantId: KILIMO_TENANT_ID, firstName: 'NSSF', lastName: 'Admin', phone: ADMIN_PHONE }
      })
      console.log(`   ✅ Created admin: ${admin.email} → TENANT_ADMIN`)
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target?.includes('phone')) {
        const existing = await db.user.findUnique({ where: { phone: ADMIN_PHONE } })
        if (existing) {
          admin = await db.user.update({
            where: { id: existing.id },
            data: { email: adminEmail, role: 'TENANT_ADMIN', passwordHash, isActive: true, tenantId: KILIMO_TENANT_ID, firstName: 'NSSF', lastName: 'Admin' }
          })
          console.log(`   ↻ Reclaimed phone ${ADMIN_PHONE}: updated to ${adminEmail} → TENANT_ADMIN`)
        }
      } else { throw e }
    }
  }

  // ─── 2. NSSF Extension Officers ───
  console.log('\n2. Creating NSSF Extension Officers...')
  for (const o of OFFICERS) {
    let user = await db.user.findFirst({ where: { email: o.email } })
    if (user) {
      user = await db.user.update({
        where: { id: user.id },
        data: { role: 'EXTENSION_OFFICER', passwordHash, isActive: true, tenantId: KILIMO_TENANT_ID, firstName: o.firstName, lastName: o.lastName, phone: o.phone }
      })
      console.log(`   ↻ Updated: ${o.email} → EXTENSION_OFFICER (${o.firstName} ${o.lastName})`)
    } else {
      try {
        user = await db.user.create({
          data: { email: o.email, passwordHash, role: 'EXTENSION_OFFICER', isActive: true, tenantId: KILIMO_TENANT_ID, firstName: o.firstName, lastName: o.lastName, phone: o.phone }
        })
        console.log(`   ✅ Created: ${o.email} → EXTENSION_OFFICER (${o.firstName} ${o.lastName})`)
      } catch (e: any) {
        if (e.code === 'P2002' && e.meta?.target?.includes('phone')) {
          const existing = await db.user.findUnique({ where: { phone: o.phone } })
          if (existing) {
            user = await db.user.update({
              where: { id: existing.id },
              data: { email: o.email, role: 'EXTENSION_OFFICER', passwordHash, isActive: true, tenantId: KILIMO_TENANT_ID, firstName: o.firstName, lastName: o.lastName }
            })
            console.log(`   ↻ Reclaimed phone ${o.phone}: updated to ${o.email} → EXTENSION_OFFICER`)
          }
        } else { throw e }
      }
    }
  }

  // ─── 3. Enable NSSF module entitlement ───
  console.log('\n3. Enabling NSSF module entitlement on Klimotrust tenant...')
  const existing = await db.moduleEntitlement.findFirst({ where: { tenantId: KILIMO_TENANT_ID, moduleCode: 'NSSF' } })
  if (existing) {
    await db.moduleEntitlement.update({ where: { id: existing.id }, data: { isEnabled: true } })
    console.log('   ↻ Updated: NSSF module already enabled')
  } else {
    await db.moduleEntitlement.create({
      data: {
        tenantId: KILIMO_TENANT_ID,
        moduleCode: 'NSSF',
        isEnabled: true,
        config: JSON.stringify({
          valueChains: [
            'Maize','Rice','Banana (matooke)','Cassava','Irish potato','Beans',
            'Fruits and vegetables','Coffee','Tea','Dairy cattle','Beef cattle / meat','Fish / Aquaculture'
          ],
          goLiveDate: '2026-09-26',
        })
      }
    })
    console.log('   ✅ Created: NSSF module enabled')
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ NSSF setup complete!')
  console.log('='.repeat(60))
  console.log('\n📋 Login Credentials (password: password123):')
  console.log('   ─────────────────────────────────────────────────────────')
  console.log('   nssf-admin@kilimo.org    → TENANT_ADMIN (web: sees all farmers)')
  for (const o of OFFICERS) {
    console.log(`   ${o.email.padEnd(26)} → EXTENSION_OFFICER (${o.firstName} ${o.lastName})`)
  }
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => db.$disconnect())
