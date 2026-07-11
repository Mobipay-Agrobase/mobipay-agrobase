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

    const entitlements = await db.moduleEntitlement.findMany({
      where: { tenantId: ctx.tenantId, isEnabled: true },
      select: { moduleCode: true },
    })

    const modules = entitlements.map(e => e.moduleCode)
    return NextResponse.json({ modules })
  } catch (error) {
    console.error('[entitlements] error:', error)
    return NextResponse.json({ modules: [] })
  }
}
