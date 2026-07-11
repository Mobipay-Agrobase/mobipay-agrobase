/**
 * Configure Klimotrust Module Entitlements
 * Run: npx tsx scripts/configure-klimotrust-modules.ts
 *
 * Enables only the modules Klimotrust needs (farmers, purchases, sales,
 * payments, loans, training, NSSF, etc.) and disables everything else
 * (carbon, traceability, EUDR, VSLA, marketplace, MFI, etc.)
 *
 * Also adds NSSF fields to the farmer profile approach — NSSF registration
 * becomes a section on the farmer profile, not a separate module.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Modules to ENABLE for Klimotrust
const ENABLED_MODULES = [
  { code: 'FARMERS',          config: '{"nssfEnabled": true}' },           // Farmer profiling + NSSF fields
  { code: 'FARM_LANDS',       config: '{}' },                              // Farm land registry with GPS
  { code: 'CULTIVATIONS',     config: '{}' },                              // Crop tracking
  { code: 'PURCHASES',        config: '{"enhancedWorkflow": true}' },      // Input purchasing
  { code: 'SALES',            config: '{"procurementMode": true}' },       // Produce procurement
  { code: 'PAYMENTS',         config: '{"flutterwave": true, "mtn": true, "airtel": true}' }, // Payment gateway
  { code: 'LOANS',            config: '{"creditScoring": true}' },         // Credit scoring + loans
  { code: 'TRAINING',         config: '{}' },                              // Farmer training
  { code: 'FARM_VISITS',      config: '{}' },                              // Field monitoring + inspection
  { code: 'REPORTS',          config: '{}' },                              // Analytics + exports
  { code: 'INVENTORY',        config: '{"enableInputs": true}' },          // Input aggregation
  { code: 'COOPERATIVE',      config: '{"enablePurchases": true, "enableSales": true, "enableLedger": true}' }, // Farmer ledger
  { code: 'NSSF',             config: '{"commissionRate": 0.30, "mobipayShare": 0.50, "klimotrustShare": 0.50, "minContribution": 10000}' }, // NSSF collection
  { code: 'SUPPORT',          config: '{}' },                              // Support tickets
  { code: 'BILLING',          config: '{"plan": "VENDOR_FINANCING"}' },   // Billing (for NSSF commission tracking)
]

// Modules to explicitly DISABLE (in case they were enabled by default)
const DISABLED_MODULES = [
  'CARBON',           // Carbon tracking — not relevant
  'TRACE',            // Traceability — not relevant
  'SATELLITE',        // Satellite imagery — not relevant
  'COMPLIANCE',       // EUDR/CBAM compliance — not relevant
  'MARKETPLACE',      // Marketplace — not relevant
  'VSLA',             // VSLA management — not relevant
  'MFI',              // MFI portal — not relevant
  'LOGISTICS',        // Transport — not relevant
  'CONTRACTS',        // Contracts — not relevant
  'QUALITY',          // Quality inspections — not relevant (for exporters)
  'INSURANCE',        // Crop insurance — can add later
]

async function main() {
  console.log('⚙️  Configuring Klimotrust Module Entitlements')
  console.log('='.repeat(60))

  const klimotrust = await db.tenant.findFirst({
    where: { name: { contains: 'Klimotrust' } },
    select: { id: true, name: true },
  })

  if (!klimotrust) {
    console.error('❌ Klimotrust tenant not found. Run seed-klimotrust-nssf.ts first.')
    process.exit(1)
  }

  console.log(`\n📋 Tenant: ${klimotrust.name} (${klimotrust.id})`)

  // Enable modules
  console.log('\n✅ Enabling modules:')
  for (const mod of ENABLED_MODULES) {
    const existing = await db.moduleEntitlement.findFirst({
      where: { tenantId: klimotrust.id, moduleCode: mod.code },
    })

    if (existing) {
      await db.moduleEntitlement.update({
        where: { id: existing.id },
        data: { isEnabled: true, config: mod.config },
      })
      console.log(`   ↻ Updated: ${mod.code}`)
    } else {
      await db.moduleEntitlement.create({
        data: {
          tenantId: klimotrust.id,
          moduleCode: mod.code,
          isEnabled: true,
          config: mod.config,
        },
      })
      console.log(`   ✅ Created: ${mod.code}`)
    }
  }

  // Disable modules
  console.log('\n❌ Disabling modules:')
  for (const code of DISABLED_MODULES) {
    const existing = await db.moduleEntitlement.findFirst({
      where: { tenantId: klimotrust.id, moduleCode: code },
    })

    if (existing) {
      if (existing.isEnabled) {
        await db.moduleEntitlement.update({
          where: { id: existing.id },
          data: { isEnabled: false },
        })
        console.log(`   ✗ Disabled: ${code}`)
      } else {
        console.log(`   - Already disabled: ${code}`)
      }
    } else {
      // Create as disabled
      await db.moduleEntitlement.create({
        data: {
          tenantId: klimotrust.id,
          moduleCode: code,
          isEnabled: false,
          config: '{}',
        },
      })
      console.log(`   ✗ Created (disabled): ${code}`)
    }
  }

  // Summary
  const allEntitlements = await db.moduleEntitlement.findMany({
    where: { tenantId: klimotrust.id },
    orderBy: { moduleCode: 'asc' },
  })

  console.log('\n' + '='.repeat(60))
  console.log('✅ Klimotrust module configuration complete!')
  console.log('='.repeat(60))

  console.log('\n📋 Enabled modules:')
  allEntitlements.filter(e => e.isEnabled).forEach(e => {
    console.log(`   ✅ ${e.moduleCode}`)
  })

  console.log('\n📋 Disabled modules:')
  allEntitlements.filter(e => !e.isEnabled).forEach(e => {
    console.log(`   ❌ ${e.moduleCode}`)
  })

  console.log('\n💡 NSSF approach: NSSF fields (nationalId, nssfNumber, activationStatus)')
  console.log('   will be added to the Farmer Profile page as a section — NOT a separate module.')
  console.log('   Field officers register farmers normally, then enroll them in NSSF.')
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => db.$disconnect())
