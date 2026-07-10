/**
 * Seed: Create the EKIBBO BillingAgreement
 * ──────────────────────────────────────────
 * Creates the VENDOR_FINANCING billing agreement for EKIBBO Coffee Exporters.
 *
 * Run AFTER the prisma migration (which creates the BillingAgreement table):
 *   npx prisma migrate dev --name add_vendor_financing_engine
 *   npx tsx scripts/seed-ekibbo-billing-agreement.ts
 *
 * This creates the agreement with Eric's approved terms:
 *   • Billing model: VENDOR_FINANCING
 *   • Fee type: PERCENTAGE (2%)
 *   • Applies to: PURCHASES
 *   • Upfront investment: UGX 28,000,000 (EDITABLE from admin UI)
 *   • Recovery period: 24 months
 *   • Recurring monthly cost: UGX 3,400,000 (FIXED)
 *
 * File: scripts/seed-ekibbo-billing-agreement.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('💳 Seeding EKIBBO Billing Agreement')
  console.log('='.repeat(60))

  // Find EKIBBO tenant
  const tenant = await db.tenant.findFirst({
    where: { name: { contains: 'EKIBBO' } },
    select: { id: true, name: true },
  })

  if (!tenant) {
    console.error('❌ EKIBBO tenant not found')
    process.exit(1)
  }

  console.log(`\n📋 Tenant: ${tenant.name} (${tenant.id})`)

  // Check if an active agreement already exists
  const existing = await db.billingAgreement.findFirst({
    where: { tenantId: tenant.id, status: 'ACTIVE' },
  })

  if (existing) {
    console.log('\n⚠️  Active billing agreement already exists:')
    console.log(`   ID: ${existing.id}`)
    console.log(`   Model: ${existing.billingModel}`)
    console.log(`   Fee: ${existing.feeType} @ ${existing.feeRate}`)
    console.log(`   Investment: UGX ${existing.upfrontInvestment}`)
    console.log(`   Status: ${existing.status}`)
    console.log('\n   To re-create, mark the existing one as SUPERSEDED first.')
    process.exit(0)
  }

  // Create the agreement
  const agreement = await db.billingAgreement.create({
    data: {
      tenantId: tenant.id,
      billingModel: 'VENDOR_FINANCING',
      costTrackingMode: 'FIXED',
      feeType: 'PERCENTAGE',
      feeRate: 0.02,  // 2%
      feeAppliesTo: 'PURCHASES',
      feeMinPerTxn: 0,
      upfrontInvestment: 28_000_000,  // UGX 28M — EDITABLE from admin UI
      recoveryPeriodMonths: 24,
      recurringMonthlyCost: 3_400_000,  // UGX 3.4M/month FIXED
      status: 'ACTIVE',
      startDate: new Date(),
    },
  })

  console.log('\n✅ Billing agreement created:')
  console.log(`   ID: ${agreement.id}`)
  console.log(`   Model: ${agreement.billingModel}`)
  console.log(`   Fee: ${agreement.feeType} @ ${(Number(agreement.feeRate) * 100)}%`)
  console.log(`   Applies to: ${agreement.feeAppliesTo}`)
  console.log(`   Upfront investment: UGX ${agreement.upfrontInvestment} (editable)`)
  console.log(`   Recovery period: ${agreement.recoveryPeriodMonths} months`)
  console.log(`   Recurring monthly cost: UGX ${agreement.recurringMonthlyCost}`)
  console.log(`   Status: ${agreement.status}`)
  console.log(`   Start date: ${agreement.startDate.toISOString()}`)

  console.log('\n📋 What happens next:')
  console.log('   1. Every purchase recorded for EKIBBO will trigger the fee hook')
  console.log('   2. 2% of each purchase amount is recorded in TransactionFeeLedger')
  console.log('   3. The surplus (fees − recurring cost) pays down the investment')
  console.log('   4. When recoveredAmount >= upfrontInvestment, status flips to RECOVERED')
  console.log('   5. On the 1st of each month, the cron job runs reconciliation')
  console.log('   6. SUPER_ADMIN can edit investment/feeRate from Billing Operations dashboard')

  console.log('\n💡 To verify:')
  console.log('   • Log in as SUPER_ADMIN → Billing Operations → see EKIBBO agreement')
  console.log('   • Log in as eric@ekibbo.co → Platform Recovery → see recovery dashboard')
  console.log('   • Record a test purchase → check TransactionFeeLedger for the fee entry')
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => db.$disconnect())
