/**
 * Seed: Create Klimotrust tenant + admin user + NSSF billing agreement
 * Run: npx tsx scripts/seed-klimotrust-nssf.ts
 *
 * Creates:
 *   1. Klimotrust tenant (if not exists)
 *   2. Klimotrust admin user (admin@klimotrust.org / password123)
 *   3. Klimotrust support user (support@klimotrust.org / password123)
 *   4. NSSF billing agreement (COLLECTION model, 30% commission, 50/50 split)
 *
 * All values are PLACEHOLDERS — update after Eric confirms:
 *   - Revenue split (currently 50/50)
 *   - Contribution amounts (currently min UGX 10,000, no max)
 *   - Klimotrust's bank/MoMo account details
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()
const DEFAULT_PASSWORD = 'password123'

async function main() {
  console.log('🌱 Seeding Klimotrust Tenant + NSSF Agreement')
  console.log('='.repeat(60))

  // ─── 1. Create Klimotrust tenant ───
  console.log('\n1. Creating Klimotrust tenant...')
  let klimotrust = await db.tenant.findFirst({
    where: { name: { contains: 'Klimotrust' } },
  })

  if (klimotrust) {
    console.log(`   ✓ Already exists: ${klimotrust.name} (${klimotrust.id})`)
    // Ensure it's active
    if (!klimotrust.isActive) {
      await db.tenant.update({ where: { id: klimotrust.id }, data: { isActive: true } })
      console.log('   ✓ Reactivated tenant')
    }
  } else {
    klimotrust = await db.tenant.create({
      data: {
        name: 'Klimotrust',
        type: 'NGO',
        country: 'Uganda',
        defaultCurrency: 'UGX',
        isActive: true,
        features: JSON.stringify({
          nssfCollection: true,
          farmerManagement: true,
          training: true,
          impactAssessment: true,
        }),
      },
    })
    console.log(`   ✅ Created: ${klimotrust.name} (${klimotrust.id})`)
  }

  // ─── 2. Create Klimotrust users ───
  console.log('\n2. Creating Klimotrust users...')
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12)

  const users = [
    {
      email: 'admin@klimotrust.org',
      role: 'TENANT_ADMIN',
      firstName: 'Klimotrust',
      lastName: 'Admin',
      phone: '+256700000100',
      description: 'Full tenant admin — manages farmers, registrations, reports',
    },
    {
      email: 'support@klimotrust.org',
      role: 'AGENT',  // Will be updated to a Klimotrust-specific role if needed
      firstName: 'Klimotrust',
      lastName: 'Support',
      phone: '+256700000101',
      description: 'Support user — handles farmer queries, contribution issues',
    },
    {
      email: 'finance@klimotrust.org',
      role: 'TENANT_ADMIN',  // Finance access — will see NSSF contributions + settlements
      firstName: 'Klimotrust',
      lastName: 'Finance',
      phone: '+256700000102',
      description: 'Finance user — views contributions, settlements, commission',
    },
  ]

  for (const u of users) {
    const existing = await db.user.findFirst({ where: { email: u.email } })
    if (existing) {
      await db.user.update({
        where: { id: existing.id },
        data: {
          role: u.role,
          passwordHash,
          isActive: true,
          tenantId: klimotrust.id,
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone,
        },
      })
      console.log(`   ↻ Updated: ${u.email} → ${u.role}`)
    } else {
      await db.user.create({
        data: {
          email: u.email,
          passwordHash,
          role: u.role,
          isActive: true,
          tenantId: klimotrust.id,
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone,
        },
      })
      console.log(`   ✅ Created: ${u.email} → ${u.role}`)
    }
    console.log(`      ${u.description}`)
  }

  // ─── 3. Create NSSF billing agreement ───
  console.log('\n3. Creating NSSF billing agreement...')
  
  // Check if agreement already exists
  const existingAgreement = await db.billingAgreement.findFirst({
    where: { tenantId: klimotrust.id, status: 'ACTIVE' },
  })

  if (existingAgreement) {
    console.log(`   ✓ Active agreement already exists: ${existingAgreement.id}`)
    console.log(`   Model: ${existingAgreement.billingModel}`)
    if (existingAgreement.billingModel === 'VENDOR_FINANCING') {
      console.log(`   Fee: ${existingAgreement.feeType} @ ${Number(existingAgreement.feeRate) * 100}%`)
      console.log(`   Investment: UGX ${existingAgreement.upfrontInvestment}`)
    }
  } else {
    // Deactivate any existing agreements
    await db.billingAgreement.updateMany({
      where: { tenantId: klimotrust.id, status: 'ACTIVE' },
      data: { status: 'SUPERSEDED', endDate: new Date() },
    })

    // Create NSSF collection agreement
    // Using VENDOR_FINANCING model with COLLECTION-specific fields
    // The NSSF commission (30%) is tracked via the NssfCommission model
    // The BillingAgreement tracks the platform fee (0% — Klimotrust doesn't pay platform fees,
    // MobiPay earns from the NSSF commission split)
    const agreement = await db.billingAgreement.create({
      data: {
        tenantId: klimotrust.id,
        billingModel: 'VENDOR_FINANCING',  // No upfront subscription — MobiPay earns from NSSF commission
        costTrackingMode: 'FIXED',
        feeType: 'PERCENTAGE',
        feeRate: 0.0,  // 0% platform fee — Klimotrust doesn't pay platform fees
        feeAppliesTo: 'NONE',  // No transaction fees on purchases/sales
        upfrontInvestment: 15_000_000,  // UGX 15M — development cost for NSSF module (PLACEHOLDER)
        recoveryPeriodMonths: 12,  // Recover over 12 months from NSSF commission (PLACEHOLDER)
        recurringMonthlyCost: 2_000_000,  // UGX 2M/month — hosting + support (PLACEHOLDER)
        status: 'ACTIVE',
        startDate: new Date(),
      },
    })

    console.log(`   ✅ Created billing agreement: ${agreement.id}`)
    console.log(`   Model: ${agreement.billingModel}`)
    console.log(`   Fee: ${agreement.feeType} @ ${Number(agreement.feeRate) * 100}% (no platform fee — earns from NSSF commission)`)
    console.log(`   Investment: UGX ${agreement.upfrontInvestment} (PLACEHOLDER — update after Eric confirms)`)
    console.log(`   Recovery: ${agreement.recoveryPeriodMonths} months`)
    console.log(`   Monthly cost: UGX ${agreement.recurringMonthlyCost} (PLACEHOLDER)`)
  }

  // ─── 4. Enable NSSF module entitlement ───
  console.log('\n4. Enabling NSSF module entitlement...')
  const nssfEntitlement = await db.moduleEntitlement.findFirst({
    where: { tenantId: klimotrust.id, moduleCode: 'NSSF' },
  })

  if (nssfEntitlement) {
    console.log('   ✓ NSSF module already enabled')
  } else {
    await db.moduleEntitlement.create({
      data: {
        tenantId: klimotrust.id,
        moduleCode: 'NSSF',
        isEnabled: true,
        config: JSON.stringify({
          commissionRate: 0.30,  // 30% from NSSF
          mobipayShare: 0.50,    // 50% of commission (PLACEHOLDER — Eric to confirm)
          klimotrustShare: 0.50, // 50% of commission (PLACEHOLDER)
          minContribution: 10000, // UGX 10,000 minimum (PLACEHOLDER)
          maxContribution: null,  // No maximum (PLACEHOLDER)
          settlementCycle: 'WEEKLY',
        }),
      },
    })
    console.log('   ✅ NSSF module enabled')
    console.log('   Commission: 30% from NSSF')
    console.log('   Split: 50/50 (PLACEHOLDER — update after Eric confirms)')
    console.log('   Min contribution: UGX 10,000 (PLACEHOLDER)')
  }

  // ─── 5. Summary ───
  console.log('\n' + '='.repeat(60))
  console.log('✅ Klimotrust setup complete!')
  console.log('='.repeat(60))

  console.log('\n📋 Tenant:')
  console.log(`   Name: ${klimotrust.name}`)
  console.log(`   ID: ${klimotrust.id}`)
  console.log(`   Country: ${klimotrust.country}`)
  console.log(`   Currency: ${klimotrust.defaultCurrency}`)

  console.log('\n📋 Login Credentials (password: password123):')
  console.log('   ─────────────────────────────────────────────────')
  console.log('   admin@klimotrust.org       → TENANT_ADMIN (full access)')
  console.log('   support@klimotrust.org     → AGENT (support + field operations)')
  console.log('   finance@klimotrust.org     → TENANT_ADMIN (finance + NSSF views)')

  console.log('\n📋 NSSF Configuration:')
  console.log('   Module: ENABLED')
  console.log('   Commission: 30% from NSSF')
  console.log('   Revenue split: 50/50 (PLACEHOLDER — Eric to confirm)')
  console.log('   Min contribution: UGX 10,000 (PLACEHOLDER)')
  console.log('   Settlement: Weekly (auto-cron every Monday)')

  console.log('\n⚠️  PLACEHOLDER VALUES — Update after Eric confirms:')
  console.log('   1. Revenue split (MobiPay vs Klimotrust)')
  console.log('   2. Contribution amount rules (min/max/frequency)')
  console.log('   3. Upfront investment amount (currently UGX 15M)')
  console.log('   4. Recurring monthly cost (currently UGX 2M)')
  console.log('   5. Klimotrust bank/MoMo account for settlements')

  console.log('\n💡 To update the NSSF config later:')
  console.log('   npx tsx -e \"')
  console.log('   import { PrismaClient } from \\'@prisma/client\\'')
  console.log('   const db = new PrismaClient()')
  console.log('   db.moduleEntitlement.updateMany({')
  console.log('     where: { moduleCode: \\'NSSF\\', tenantId: \\'TENANT_ID\\' },')
  console.log('     data: { config: JSON.stringify({ ...newConfig }) }')
  console.log('   })')
  console.log('   \"')
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => db.$disconnect())
