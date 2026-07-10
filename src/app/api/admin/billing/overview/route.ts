/**
 * GET /api/admin/billing/overview
 * SUPER_ADMIN only — returns billing overview across ALL tenants.
 * Used by the MobiPay-internal Billing Operations Dashboard.
 */
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { getBillingOverview } from '@/lib/vendor-financing/engine'

export async function GET() {
  try {
    const ctx = await getTenantContext()
    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const overview = await getBillingOverview()
    return NextResponse.json(overview)
  } catch (error: any) {
    console.error('[billing/overview] error:', error)
    return NextResponse.json({ error: 'Failed to load billing overview', details: error?.message }, { status: 500 })
  }
}
