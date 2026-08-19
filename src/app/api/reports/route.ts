import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { db } from '@/lib/db'

/**
 * GET /api/reports
 *
 * Lists available report templates for the caller's tenant.
 *
 * Module-aware: only includes report types whose underlying module is
 * enabled for the tenant. For example, 'vsla-savings' is only included
 * if the tenant has the VSLA module entitlement. This prevents EKIBBO
 * (a coffee exporter without VSLA) from seeing VSLA reports in their
 * Reports & Analytics menu.
 *
 * SUPER_ADMIN sees ALL report types (for cross-tenant admin).
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext(request)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)

    // Full list — each report maps to a module code (or null for core reports
    // that every tenant has access to).
    const allReports = [
      { type: 'farmer-registrations', label: 'Farmer Registrations', description: 'List of all registered farmers with demographics', module: null },
      { type: 'sales-summary', label: 'Sales Summary', description: 'Aggregated sales data by period, commodity, and buyer', module: null },
      { type: 'loan-portfolio', label: 'Loan Portfolio', description: 'Outstanding loans, disbursements, and repayment status', module: 'LOANS' },
      { type: 'inventory-stock', label: 'Inventory Stock', description: 'Current warehouse stock levels and movements', module: 'INVENTORY' },
      { type: 'vsla-savings', label: 'VSLA Savings', description: 'VSLA group savings and loan activity', module: 'VSLA' },
      { type: 'carbon-credits', label: 'Carbon Credits', description: 'Carbon credit portfolio and transaction history', module: 'CARBON' },
      { type: 'compliance-cbam', label: 'CBAM Compliance', description: 'EU CBAM reporting data and emissions', module: 'COMPLIANCE' },
      { type: 'compliance-eudr', label: 'EUDR Compliance', description: 'EUDR due diligence and risk assessments', module: 'COMPLIANCE' },
      { type: 'traceability', label: 'Traceability', description: 'Supply chain traceability and farm passport data', module: 'TRACE' },
      { type: 'trainings', label: 'Trainings', description: 'Training sessions, attendance, and impact', module: 'TRAINING' },
    ]

    // SUPER_ADMIN sees all reports (cross-tenant admin view)
    let available = allReports
    if (!ctx.isSuperAdmin && ctx.tenantId) {
      // Fetch the tenant's enabled module codes
      const entitlements = await db.moduleEntitlement.findMany({
        where: { tenantId: ctx.tenantId, isEnabled: true },
        select: { moduleCode: true },
      })
      const enabledModules = new Set(entitlements.map(e => e.moduleCode.toUpperCase()))

      // Filter: keep reports with module=null (core) OR module in the tenant's entitlements
      available = allReports.filter(r => r.module === null || enabledModules.has(r.module))
    }

    const search = (searchParams.get('q') || '').toLowerCase()
    const filtered = search
      ? available.filter((r) => r.label.toLowerCase().includes(search) || r.type.includes(search))
      : available

    // Strip the internal `module` field from the response
    return NextResponse.json({ data: filtered.map(({ module, ...rest }) => rest) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list reports' }, { status: 500 })
  }
}
