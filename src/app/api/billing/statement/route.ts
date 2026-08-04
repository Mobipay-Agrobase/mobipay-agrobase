/**
 * GET /api/billing/statement?tenantId=X&period=2026-07
 * Returns an HTML billing statement for the given tenant + period.
 * Viewable in browser, printable to PDF.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { generateStatementHTML } from '@/lib/vendor-financing/statement-generator'

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'billing:read')) {
      return NextResponse.json({ error: 'Billing read access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || ctx.tenantId
    const period = searchParams.get('period')

    if (!period) {
      return NextResponse.json({ error: 'period parameter is required (e.g., 2026-07)' }, { status: 400 })
    }

    // Super admin can view any tenant's statement; others only their own
    if (!ctx.isSuperAdmin && ctx.role !== 'MOBIPAY_FINANCE' && tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: 'Cannot view other tenants\' statements' }, { status: 403 })
    }

    const html = await generateStatementHTML(tenantId, period)
    if (!html) {
      return NextResponse.json({ error: 'No statement found for this period' }, { status: 404 })
    }

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error: any) {
    console.error('[billing/statement] error:', error)
    return NextResponse.json({ error: 'Failed to generate statement' }, { status: 500 })
  }
}
