import { db } from '@/lib/db'
import type { TenantContext } from '@/lib/tenant'

/**
 * EKIBBO loyalty feature is exclusive to the EKIBBO tenant.
 *
 * The EKIBBO tenant is the only tenant with type=EXPORTER on the platform
 * (verified: only "EKIBBO Coffee Exporters" has this type). We use the
 * tenant type as the gate so the loyalty feature doesn't leak to other
 * tenants (Kilimotrust, SAA-WFP-AMS, Agrobase VSLA, etc.).
 *
 * This helper is used by all loyalty-related API endpoints + the inline
 * loyalty blocks in /api/dashboard and /api/farmers/[id] to ensure
 * non-EKIBBO tenants never see loyalty data.
 *
 * SUPER_ADMIN bypasses the check (they can view loyalty for any tenant
 * when simulating an EKIBBO tenant, or for cross-tenant analysis).
 *
 * When a SUPER_ADMIN is simulating an EKIBBO tenant, the simulated
 * tenant type is available in ctx.simulatedTenantType — we use that
 * to allow the loyalty feature during simulation.
 */

// In-memory cache of tenantId → tenantType (5 min TTL)
// Avoids a DB hit on every loyalty computation for the same tenant.
const tenantTypeCache = new Map<string, { type: string; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Returns true if the caller's tenant is the EKIBBO tenant (type=EXPORTER).
 *
 * - SUPER_ADMIN NOT simulating: returns true (lets super admin see loyalty
 *   for cross-tenant analysis — they're the platform owner)
 * - SUPER_ADMIN simulating an EKIBBO tenant: returns true
 * - SUPER_ADMIN simulating a non-EKIBBO tenant: returns false
 * - Regular user on the EKIBBO tenant: returns true
 * - Regular user on any other tenant: returns false
 */
export async function isEkibboTenant(ctx: TenantContext): Promise<boolean> {
  // SUPER_ADMIN not simulating — allow (platform-wide admin view)
  if (ctx.isSuperAdmin && !ctx.isSimulating) return true

  // SUPER_ADMIN simulating — check the simulated tenant type
  if (ctx.isSimulating && ctx.simulatedTenantType) {
    return ctx.simulatedTenantType === 'EXPORTER'
  }

  // Regular user — fetch the tenant type from DB (with cache)
  if (!ctx.tenantId) return false
  return isEkibboTenantById(ctx.tenantId)
}

/**
 * Returns true if the tenant with the given ID is the EKIBBO tenant
 * (type=EXPORTER). Uses an in-memory cache to avoid repeated DB hits.
 */
export async function isEkibboTenantById(tenantId: string): Promise<boolean> {
  // Check cache
  const cached = tenantTypeCache.get(tenantId)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.type === 'EXPORTER'
  }

  // Fetch from DB
  try {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { type: true },
    })
    const type = tenant?.type || ''
    tenantTypeCache.set(tenantId, { type, expiresAt: Date.now() + CACHE_TTL_MS })
    return type === 'EXPORTER'
  } catch (e) {
    console.error('isEkibboTenantById error:', e)
    return false
  }
}
