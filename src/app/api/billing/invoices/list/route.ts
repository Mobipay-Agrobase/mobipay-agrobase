/**
 * GET /api/billing/invoices/list
 * Returns pending + recent invoices for the calling tenant.
 * Used by the Recovery Dashboard to show "Pay Invoice" buttons.
 */
import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'billing:read')) {
      return NextResponse.json({ error: 'Billing read access required' }, { status: 403 })
    }

    const invoices = await db.invoice.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ invoices })
  } catch (error: any) {
    console.error('[billing/invoices/list] error:', error)
    return NextResponse.json({ error: 'Failed to load invoices' }, { status: 500 })
  }
}
