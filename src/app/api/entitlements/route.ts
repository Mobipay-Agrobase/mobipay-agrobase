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
      return NextResponse.json({ modules: [] })
    }

    // Return ALL entitlement records (both enabled and disabled)
    // Sidebar will: show if enabled OR no record exists, hide only if explicitly disabled
    const entitlements = await db.moduleEntitlement.findMany({
      where: { tenantId: ctx.tenantId },
      select: { moduleCode: true, isEnabled: true },
    })

    const enabled = entitlements.filter(e => e.isEnabled).map(e => e.moduleCode)
    const disabled = entitlements.filter(e => !e.isEnabled).map(e => e.moduleCode)
    return NextResponse.json({ modules: enabled, disabledModules: disabled })
  } catch (error) {
    console.error('[entitlements] error:', error)
    return NextResponse.json({ modules: [] })
  }
}
