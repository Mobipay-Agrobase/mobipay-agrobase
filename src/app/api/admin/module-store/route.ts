/**
 * Module Store API — Super Admin manages which modules each tenant has access to.
 * GET: List all modules + which tenants have them enabled
 * POST: Toggle a module for a specific tenant
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'

// All available modules in the platform
const ALL_MODULES = [
  { code: 'FARMERS', name: 'Farmer Management', category: 'Core', isCore: true, description: 'Farmer profiles, KYC, farm lands' },
  { code: 'VSLA', name: 'VSLA Management', category: 'Financial', isCore: false, description: 'Village Savings & Loan Associations' },
  { code: 'NSSF', name: 'NSSF Contributions', category: 'Financial', isCore: false, description: 'NSSF farmer contributions and tracking' },
  { code: 'PAYMENTS', name: 'Mobile Money', category: 'Financial', isCore: false, description: 'MTN MoMo, Airtel Money payments' },
  { code: 'LOANS', name: 'Loan Management', category: 'Financial', isCore: false, description: 'Institutional loan applications' },
  { code: 'BILLING', name: 'Billing & Usage', category: 'Financial', isCore: false, description: 'SaaS subscription billing' },
  { code: 'MARKETPLACE', name: 'Marketplace', category: 'Commerce', isCore: false, description: 'Produce listings and buyer matching' },
  { code: 'INVENTORY', name: 'Input Aggregation', category: 'Commerce', isCore: false, description: 'Input purchase and distribution' },
  { code: 'COOPERATIVE', name: 'Cooperative Operations', category: 'Commerce', isCore: false, description: 'Purchases, sales, processing, deliveries' },
  { code: 'TRACE', name: 'Traceability', category: 'Compliance', isCore: false, description: 'Farm-to-cup traceability' },
  { code: 'COMPLIANCE', name: 'Compliance (EUDR)', category: 'Compliance', isCore: false, description: 'EUDR, Rainforest Alliance, GlobalG.A.P.' },
  { code: 'CARBON', name: 'Carbon & CBAM', category: 'Compliance', isCore: false, description: 'Carbon credits, CBAM reports' },
  { code: 'SATELLITE', name: 'Satellite Monitoring', category: 'Compliance', isCore: false, description: 'NDVI, deforestation monitoring' },
  { code: 'TRAINING', name: 'Training & Groups', category: 'Engagement', isCore: false, description: 'Training events, attendance, cohorts' },
  { code: 'SURVEYS', name: 'Surveys & Feedback', category: 'Engagement', isCore: false, description: 'Surveys, farm visits, feedback' },
  { code: 'COMMUNICATION', name: 'Communication', category: 'Engagement', isCore: false, description: 'SMS, USSD, notifications' },
  { code: 'REPORTS', name: 'Reports & Analytics', category: 'Intelligence', isCore: false, description: 'Dashboards, charts, exports' },
  { code: 'MFI', name: 'MFI / Bank Portal', category: 'Financial', isCore: false, description: 'Microfinance institution loans' },
  { code: 'LOGISTICS', name: 'Transport & Logistics', category: 'Commerce', isCore: false, description: 'Vehicle management, shipments' },
  { code: 'CONTRACTS', name: 'Contracts', category: 'Commerce', isCore: false, description: 'Contract management' },
  { code: 'QUALITY', name: 'Quality Control', category: 'Commerce', isCore: false, description: 'Inspections, grading' },
  { code: 'INSURANCE', name: 'Crop Insurance', category: 'Financial', isCore: false, description: 'Crop insurance policies' },
  { code: 'SUPPORT', name: 'Support Tickets', category: 'Admin', isCore: false, description: 'Tenant support ticket system' },
  { code: 'RESET_MARKETLINK', name: 'ReSET MarketLink', category: 'Humanitarian', isCore: false, description: 'Voucher + cash disbursement platform' },
]

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (ctx.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const url = new URL(req.url)
    const tenantId = url.searchParams.get('tenantId')

    if (tenantId) {
      // Get entitlements for a specific tenant
      const entitlements = await db.moduleEntitlement.findMany({
        where: { tenantId },
        select: { moduleCode: true, isEnabled: true },
      })
      const entMap = new Map(entitlements.map(e => [e.moduleCode, e.isEnabled]))
      
      const modules = ALL_MODULES.map(m => ({
        ...m,
        isEnabled: entMap.has(m.code) ? entMap.get(m.code) : m.isCore,
      }))

      return NextResponse.json({ modules })
    }

    // Get all tenants with their module counts
    const tenants = await db.tenant.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true, country: true },
      orderBy: { name: 'asc' },
    })

    const tenantModules = await Promise.all(
      tenants.map(async (t) => {
        const enabled = await db.moduleEntitlement.count({
          where: { tenantId: t.id, isEnabled: true },
        })
        return { ...t, enabledModules: enabled }
      })
    )

    return NextResponse.json({ 
      modules: ALL_MODULES,
      tenants: tenantModules,
    })
  } catch (error) {
    console.error('[module-store GET]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (ctx.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { tenantId, moduleCode, isEnabled } = body

    if (!tenantId || !moduleCode) {
      return NextResponse.json({ error: 'tenantId and moduleCode required' }, { status: 400 })
    }

    // Don't allow disabling core modules
    const module = ALL_MODULES.find(m => m.code === moduleCode)
    if (module?.isCore && !isEnabled) {
      return NextResponse.json({ error: 'Core modules cannot be disabled' }, { status: 400 })
    }

    const entitlement = await db.moduleEntitlement.upsert({
      where: { tenantId_moduleCode: { tenantId, moduleCode } },
      update: { isEnabled },
      create: { tenantId, moduleCode, isEnabled },
    })

    return NextResponse.json({ entitlement })
  } catch (error) {
    console.error('[module-store POST]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
