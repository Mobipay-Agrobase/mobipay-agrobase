/**
 * GET /api/entitlements
 * Returns the calling tenant's enabled module codes.
 * Used by the Sidebar to filter menu items by module entitlement.
 */
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'

export async function GET() {
  try {
    const ctx = await getTenantContext()
    if (!ctx.tenantId) {
      return NextResponse.json({ modules: [], disabledModules: [], tenantName: null, tenantType: null })
    }

    // Return ALL entitlement records (both enabled and disabled)
    // Sidebar will: show if enabled OR no record exists, hide only if explicitly disabled
    const [entitlements, tenant] = await Promise.all([
      db.moduleEntitlement.findMany({
        where: { tenantId: ctx.tenantId },
        select: { moduleCode: true, isEnabled: true },
      }),
      db.tenant.findUnique({ where: { id: ctx.tenantId }, select: { name: true, type: true } }),
    ])

    const enabled = entitlements.filter(e => e.isEnabled).map(e => e.moduleCode)
    const disabled = entitlements.filter(e => !e.isEnabled).map(e => e.moduleCode)
    // tenantName lets the UI apply tenant-brand rules (e.g. hide non-Ekibbo
    // modules) independent of the user's role — important for shared roles like
    // TENANT_ADMIN that are used across multiple tenants.
    return NextResponse.json({
      modules: enabled,
      disabledModules: disabled,
      tenantName: tenant?.name ?? null,
      tenantType: tenant?.type ?? null,
    })
  } catch (error) {
    console.error('[entitlements] error:', error)
    return NextResponse.json({ modules: [] })
  }
}
