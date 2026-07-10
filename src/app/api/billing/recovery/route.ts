/**
 * GET /api/billing/recovery
 * Returns the recovery status for the CALLING tenant's agreement.
 * Accessible to: SUPER_ADMIN, EKB_MD, EKB_FINANCE (and any role with billing:read)
 *
 * This powers the EKIBBO-facing recovery dashboard.
 */
import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { getRecoveryStatus } from '@/lib/vendor-financing/engine'

export async function GET() {
  try {
    const ctx = await getTenantContext()

    // Super admin can query any tenant; everyone else needs billing:read
    if (!ctx.isSuperAdmin && !hasPermission(ctx.role, 'billing:read')) {
      return NextResponse.json({ error: 'Billing read access required' }, { status: 403 })
    }

    const status = await getRecoveryStatus(ctx.tenantId)
    return NextResponse.json(status)
  } catch (error: any) {
    console.error('[billing/recovery] error:', error)
    return NextResponse.json({ error: 'Failed to load recovery status' }, { status: 500 })
  }
}
