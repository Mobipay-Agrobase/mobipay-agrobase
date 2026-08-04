/**
 * P4 Seed Script — Seed BillingPlan rows from the existing hardcoded plans.
 *
 * Migrates the 5 conflicting hardcoded price tables into a single
 * BillingPlan table so super-admins can manage plans dynamically.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... npx tsx scripts/seed-billing-plans.ts
 *
 * Idempotent: re-running on a DB that already has plans is a no-op.
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

interface PlanSeed {
  code: string
  name: string
  description: string
  modules: string[]
  priceMonthly: number
  priceAnnual: number
  currency: string
  maxUsers: number
  maxFarmers: number
  features: Record<string, boolean>
  sortOrder: number
}

// Canonical plan definitions — reconciles the 5 conflicting price tables
// from plans.ts:81, plans.ts:246, subscription/route.ts:6, invoices/route.ts:62,
// flutterwave/initiate/route.ts:44, admin/tenants/[id]/route.ts:81.
// Prices are in USD.
const PLANS: PlanSeed[] = [
  {
    code: 'FREE',
    name: 'Free',
    description: 'For small groups getting started',
    modules: ['dashboard', 'farmers'],
    priceMonthly: 0,
    priceAnnual: 0,
    currency: 'USD',
    maxUsers: 5,
    maxFarmers: 50,
    features: { sms: false, api: false, whiteLabel: false, multiCurrency: false, exportData: true },
    sortOrder: 0,
  },
  {
    code: 'BASIC',
    name: 'Basic',
    description: 'For small cooperatives and NGOs',
    modules: ['dashboard', 'farmers', 'vsla', 'marketplace', 'training'],
    priceMonthly: 49,
    priceAnnual: 39,
    currency: 'USD',
    maxUsers: 10,
    maxFarmers: 500,
    features: { sms: true, api: false, whiteLabel: false, multiCurrency: false, exportData: true },
    sortOrder: 1,
  },
  {
    code: 'STANDARD',
    name: 'Standard',
    description: 'For growing cooperatives with traceability needs',
    modules: [
      'dashboard', 'farmers', 'vsla', 'marketplace', 'training',
      'loans', 'traceability', 'compliance', 'input_management',
      'warehouse', 'cooperative', 'analytics', 'credit_scoring',
      'reports', 'notifications', 'farm_visits', 'surveys',
      'audit_log', 'data_export', 'multi_currency',
    ],
    priceMonthly: 149,
    priceAnnual: 119,
    currency: 'USD',
    maxUsers: 25,
    maxFarmers: 2000,
    features: { sms: true, api: true, whiteLabel: false, multiCurrency: true, exportData: true, prioritySupport: true },
    sortOrder: 2,
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'For large organizations with full feature access',
    modules: [
      'dashboard', 'farmers', 'vsla', 'marketplace', 'training',
      'loans', 'traceability', 'compliance', 'input_management',
      'warehouse', 'cooperative', 'analytics', 'credit_scoring',
      'reports', 'notifications', 'farm_visits', 'surveys',
      'audit_log', 'data_export', 'multi_currency',
      'carbon', 'mfi', 'transport', 'channel_sim',
      'impact_assessment', 'feedback', 'agritrack',
      'purchases', 'approvals', 'processing', 'sales',
      'deliveries', 'consignments',
    ],
    priceMonthly: 399,
    priceAnnual: 319,
    currency: 'USD',
    maxUsers: 999999, // effectively unlimited
    maxFarmers: 999999,
    features: { sms: true, api: true, whiteLabel: true, multiCurrency: true, exportData: true, prioritySupport: true, customIntegrations: true },
    sortOrder: 3,
  },
]

async function main() {
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('  P4 Seed: BillingPlan rows (Dynamic Billing)')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('')

  let created = 0
  let updated = 0
  let unchanged = 0

  for (const plan of PLANS) {
    const existing = await db.billingPlan.findUnique({ where: { code: plan.code } })
    if (existing) {
      // Update if any field differs
      const needsUpdate =
        existing.name !== plan.name ||
        Number(existing.priceMonthly) !== plan.priceMonthly ||
        Number(existing.priceAnnual) !== plan.priceAnnual ||
        existing.maxUsers !== plan.maxUsers ||
        existing.maxFarmers !== plan.maxFarmers
      if (needsUpdate) {
        await db.billingPlan.update({
          where: { id: existing.id },
          data: {
            name: plan.name,
            description: plan.description,
            modules: JSON.stringify(plan.modules),
            priceMonthly: plan.priceMonthly,
            priceAnnual: plan.priceAnnual,
            currency: plan.currency,
            maxUsers: plan.maxUsers,
            maxFarmers: plan.maxFarmers,
            features: JSON.stringify(plan.features),
            sortOrder: plan.sortOrder,
          },
        })
        console.log(`  ↻ Updated: ${plan.code} (${plan.name})`)
        updated++
      } else {
        console.log(`  ✓ Exists:  ${plan.code} (${plan.name})`)
        unchanged++
      }
    } else {
      await db.billingPlan.create({
        data: {
          code: plan.code,
          name: plan.name,
          description: plan.description,
          modules: JSON.stringify(plan.modules),
          priceMonthly: plan.priceMonthly,
          priceAnnual: plan.priceAnnual,
          currency: plan.currency,
          maxUsers: plan.maxUsers,
          maxFarmers: plan.maxFarmers,
          features: JSON.stringify(plan.features),
          isActive: true,
          isCustom: false,
          sortOrder: plan.sortOrder,
        },
      })
      console.log(`  + Created: ${plan.code} (${plan.name}) — $${plan.priceMonthly}/mo, $${plan.priceAnnual}/yr`)
      created++
    }
  }

  console.log('')
  console.log(`  Summary: ${created} created, ${updated} updated, ${unchanged} unchanged`)
  console.log('')

  // Verify
  const count = await db.billingPlan.count()
  console.log(`  Total BillingPlan rows in DB: ${count}`)
  console.log('')
  console.log('✓ Seed complete.')
  console.log('')
}

main()
  .catch((err) => {
    console.error('')
    console.error('❌ Seed failed:', err.message)
    console.error('')
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
