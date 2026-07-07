/**
 * Phase 0: EKIBBO Tenant Configuration
 *
 * 1. Enable all universal modules for EKIBBO (Carbon, EUDR, Satellite, etc.)
 * 2. Set feature flags for EKIBBO-specific features
 * 3. Create EKIBBO user accounts (6 roles from their requirements)
 * 4. Verify tenant is active with ENTERPRISE subscription
 *
 * Usage: npx tsx scripts/seed-ekibbo-phase0.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

const EKIBBO_TENANT_NAME = 'EKIBBO Coffee Exporters'
const DEFAULT_PASSWORD = 'password123'

// All universal modules to enable for EKIBBO
const UNIVERSAL_MODULES = [
  { code: 'FARMERS',       config: '{"maxFarmers": -1}' },              // Unlimited farmers
  { code: 'VSLA',          config: '{"maxGroups": 100}' },              // VSLA/Loans
  { code: 'MARKETPLACE',   config: '{"commissionRate": 0}' },           // No commission (internal)
  { code: 'TRAINING',      config: '{}' },                              // Trainings + Farm Visits
  { code: 'TRACE',         config: '{"enableQR": true}' },              // Traceability + QR
  { code: 'COMPLIANCE',    config: '{"eudr": true, "cbam": true}' },   // EUDR + CBAM
  { code: 'CARBON',        config: '{"verra": true, "goldStandard": true}' }, // Carbon credits
  { code: 'SATELLITE',     config: '{"ndvi": true, "deforestation": true}' }, // Satellite monitoring
  { code: 'LOANS',         config: '{}' },                              // Loan management
  { code: 'INVENTORY',     config: '{"enableInputs": true}' },          // Input aggregation
  { code: 'COOPERATIVE',   config: '{"enablePurchases": true, "enableSales": true}' }, // Purchases + Sales
  { code: 'REPORTS',       config: '{}' },                              // Reports + Analytics
  { code: 'SURVEYS',       config: '{}' },                              // Surveys + Farm Visits
  { code: 'PAYMENTS',      config: '{"flutterwave": true}' },           // Payment gateway
  { code: 'BILLING',       config: '{"plan": "ENTERPRISE"}' },          // Billing
  { code: 'QUALITY',       config: '{}' },                              // Quality inspections
  { code: 'LOGISTICS',     config: '{"enableDeliveries": true}' },      // Deliveries
  { code: 'CONTRACTS',     config: '{}' },                              // Contracts + Consignments
]

// EKIBBO-specific feature flags
const EKIBBO_FEATURES = {
  purchaseWorkflow: true,      // Enhanced purchase with quality checks + deductions
  farmerLedger: true,          // Unified farmer ledger engine
  inputDistribution: true,     // Farmer-level input distribution tracking
  cropInsurance: true,         // Crop insurance module
  bambooTracking: true,        // Bamboo variety + seedling tracking
  customFarmerCode: true,      // BS0001ZE1 format
  shadeTreeTracking: true,     // Shade tree varieties on farmer profile
  approvalWorkflow: true,      // Multi-level approval (Ops Manager → Finance)
  momoDeductions: true,        // Mobile money charges + tax deductions
  moisturePhotoUpload: true,   // Photo of moisture meter reading
}

// EKIBBO user accounts (6 roles from their requirements)
const EKIBBO_USERS = [
  {
    role: 'TENANT_ADMIN',
    firstName: 'Eric',
    lastName: 'Agyei',
    email: 'eric@ekibbo.co',
    phone: '+256785122114',
  },
  {
    role: 'TENANT_ADMIN',  // Operations Manager — mapped to Tenant Admin with ops focus
    firstName: 'Operations',
    lastName: 'Manager',
    email: 'ops@ekibbo.co',
    phone: '+256785122001',
  },
  {
    role: 'TENANT_ADMIN',  // Finance Officer — mapped to Tenant Admin with finance focus
    firstName: 'Finance',
    lastName: 'Officer',
    email: 'finance@ekibbo.co',
    phone: '+256785122002',
  },
  {
    role: 'AGENT',  // Finance & Ops Assistant — mapped to Agent (draft-only editing)
    firstName: 'Finance',
    lastName: 'Assistant',
    email: 'assistant@ekibbo.co',
    phone: '+256785122003',
  },
  {
    role: 'CBT',  // M, E & C Officer — mapped to CBT (dashboard + reports + surveys)
    firstName: 'MEC',
    lastName: 'Officer',
    email: 'mec@ekibbo.co',
    phone: '+256785122004',
  },
  {
    role: 'EXTENSION_OFFICER',  // Field data collection
    firstName: 'Extension',
    lastName: 'Officer1',
    email: 'eo1@ekibbo.co',
    phone: '+256785122005',
  },
  {
    role: 'EXTENSION_OFFICER',  // Second EO
    firstName: 'Extension',
    lastName: 'Officer2',
    email: 'eo2@ekibbo.co',
    phone: '+256785122006',
  },
]

async function main() {
  console.log('🚀 Phase 0: EKIBBO Tenant Configuration')
  console.log('='.repeat(60))

  // 1. Find EKIBBO tenant
  const tenant = await db.tenant.findFirst({
    where: { name: { contains: 'EKIBBO' } },
    include: {
      _count: { select: { users: true, farmerProfiles: true, moduleEntitlements: true } },
      subscriptions: true,
    },
  })

  if (!tenant) {
    console.error('❌ EKIBBO tenant not found!')
    process.exit(1)
  }

  console.log(`\n📋 Tenant: ${tenant.name}`)
  console.log(`   ID: ${tenant.id}`)
  console.log(`   Country: ${tenant.country}`)
  console.log(`   Active: ${tenant.isActive}`)
  console.log(`   Users: ${tenant._count.users}`)
  console.log(`   Farmers: ${tenant._count.farmerProfiles}`)
  console.log(`   Module Entitlements: ${tenant._count.moduleEntitlements}`)
  console.log(`   Subscriptions: ${tenant.subscriptions.length}`)

  // 2. Set feature flags on tenant
  console.log('\n⚙️  Setting feature flags...')
  await db.tenant.update({
    where: { id: tenant.id },
    data: {
      features: JSON.stringify(EKIBBO_FEATURES),
      isActive: true,
    },
  })
  console.log('   ✅ Feature flags set:')
  for (const [key, value] of Object.entries(EKIBBO_FEATURES)) {
    console.log(`      ${key}: ${value}`)
  }

  // 3. Enable all universal modules
  console.log('\n📦 Enabling universal modules...')
  for (const mod of UNIVERSAL_MODULES) {
    const existing = await db.moduleEntitlement.findFirst({
      where: { tenantId: tenant.id, moduleCode: mod.code },
    })

    if (existing) {
      // Update existing
      await db.moduleEntitlement.update({
        where: { id: existing.id },
        data: { isEnabled: true, config: mod.config },
      })
      console.log(`   ↻ Updated: ${mod.code}`)
    } else {
      // Create new
      await db.moduleEntitlement.create({
        data: {
          tenantId: tenant.id,
          moduleCode: mod.code,
          isEnabled: true,
          config: mod.config,
        },
      })
      console.log(`   ✅ Created: ${mod.code}`)
    }
  }

  // 4. Ensure ENTERPRISE subscription is active
  console.log('\n💳 Checking subscription...')
  const activeSub = tenant.subscriptions.find(s => s.status === 'ACTIVE' || s.status === 'TRIAL')

  if (activeSub) {
    console.log(`   ✅ Subscription: ${activeSub.plan} (${activeSub.status})`)
    if (activeSub.status === 'TRIAL') {
      console.log(`   ⚠️  Trial ends: ${activeSub.trialEndsAt?.toLocaleDateString() || 'N/A'}`)
    }
  } else {
    console.log('   ⚠️  No active subscription found. Creating ENTERPRISE trial...')
    await db.subscription.create({
      data: {
        tenantId: tenant.id,
        plan: 'ENTERPRISE',
        amount: 500,
        currency: 'USD',
        billingCycle: 'MONTHLY',
        status: 'TRIAL',
        trialStartsAt: new Date(),
        trialEndsAt: new Date(Date.now() + 30 * 86400000), // 30-day trial
        startDate: new Date(),
      },
    })
    console.log('   ✅ Created ENTERPRISE trial (30 days)')
  }

  // 5. Create user accounts
  console.log('\n👥 Creating user accounts...')
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12)

  for (const user of EKIBBO_USERS) {
    const existing = await db.user.findFirst({
      where: { OR: [{ email: user.email }, { phone: user.phone }] },
    })

    if (existing) {
      // Update password and role
      await db.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          role: user.role,
          isActive: true,
          tenantId: tenant.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        },
      })
      console.log(`   ↻ Updated: ${user.role.padEnd(22)} | ${user.email}`)
    } else {
      await db.user.create({
        data: {
          ...user,
          passwordHash,
          isActive: true,
          tenantId: tenant.id,
        },
      })
      console.log(`   ✅ Created: ${user.role.padEnd(22)} | ${user.email}`)
    }
  }

  // 6. Summary
  console.log('\n' + '='.repeat(60))
  console.log('✅ Phase 0 Complete!')
  console.log('='.repeat(60))
  console.log(`\n📋 EKIBBO Configuration Summary:`)
  console.log(`   Tenant: ${tenant.name} (${tenant.id})`)
  console.log(`   Status: ACTIVE`)
  console.log(`   Feature Flags: ${Object.keys(EKIBBO_FEATURES).length} enabled`)
  console.log(`   Universal Modules: ${UNIVERSAL_MODULES.length} enabled`)
  console.log(`   User Accounts: ${EKIBBO_USERS.length} created/updated`)
  console.log(`   Password: ${DEFAULT_PASSWORD} (all accounts)`)

  console.log('\n📋 Login Credentials:')
  console.log('   ────────────────────────────────────────────')
  for (const u of EKIBBO_USERS) {
    console.log(`   ${u.role.padEnd(22)} | ${u.email.padEnd(30)} | ${u.phone}`)
  }
  console.log(`\n   🔑 Password for all: ${DEFAULT_PASSWORD}`)

  console.log('\n📋 Enabled Universal Modules:')
  for (const m of UNIVERSAL_MODULES) {
    console.log(`   ✅ ${m.code}`)
  }

  console.log('\n📋 EKIBBO Feature Flags:')
  for (const [key, value] of Object.entries(EKIBBO_FEATURES)) {
    console.log(`   ⚡ ${key}: ${value}`)
  }

  console.log('\n🌐 Platform URL: https://mobipay-agrobase.vercel.app')
  console.log('\n📝 Next Steps:')
  console.log('   Phase 1: Schema + APIs + Connectors (Week 1-2)')
  console.log('   Phase 2: Web UI (Week 3-4)')
  console.log('   Phase 3: Mobile App (Week 5-6)')
  console.log('   Phase 4: Testing & Onboarding (Week 7)')
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => db.$disconnect())
