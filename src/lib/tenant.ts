import { headers } from 'next/headers'
import { db } from '@/lib/db'
import type { NextRequest } from 'next/server'

/**
 * Extract tenant context from request headers injected by middleware.
 * Use this in API routes to scope database queries.
 */
export interface TenantContext {
  userId: string
  role: string
  tenantId: string
  tenantScope: string[]  // list of allowed tenant IDs (empty array = no filter for SUPER_ADMIN)
  isSuperAdmin: boolean
  /** True when a SUPER_ADMIN is currently simulating a tenant context.
   *  Set by middleware when the `simulate_tenant` cookie is present and valid. */
  isSimulating: boolean
  /** The tenant ID being simulated, if `isSimulating` is true. */
  simulatedTenantId?: string
  /** The display name of the simulated tenant, if `isSimulating` is true. */
  simulatedTenantName?: string
  /** The type of the simulated tenant (COOPERATIVE, NGO, etc.). */
  simulatedTenantType?: string
}

/**
 * Get the current user's tenant context from the request headers.
 * Reads from Next.js headers() API (set by middleware).
 *
 * When a SUPER_ADMIN is simulating a tenant (via /api/admin/simulate/start),
 * the middleware narrows `x-tenant-scope` and `x-tenant-id` to the simulated
 * tenant, and sets `x-simulated-tenant-id` / `x-simulated-tenant-name` /
 * `x-simulated-tenant-type`. This function exposes both:
 *   - `tenantId` / `tenantScope` reflect the SIMULATED tenant (so all
 *     Prisma queries are correctly scoped via `buildTenantFilter`),
 *   - `isSimulating` / `simulatedTenantId` / etc. expose the simulation
 *     metadata for audit logging and UI affordances.
 *
 * Accepts an optional NextRequest for backward compatibility — it is NOT used
 * since Next.js 13+ Route Handlers can access headers via the `headers()` API.
 *
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const ctx = await getTenantContext()  // or getTenantContext(request) — both work
 *   const farmers = await db.farmerProfile.findMany({
 *     where: { ...buildTenantFilter(ctx) },
 *   })
 * }
 * ```
 */
export async function getTenantContext(_req?: NextRequest | Request): Promise<TenantContext> {
  const headersList = await headers()
  const userId = headersList.get('x-user-id') || ''
  const role = headersList.get('x-user-role') || ''
  const tenantId = headersList.get('x-tenant-id') || ''
  const tenantScope = headersList.get('x-tenant-scope') || ''
  const simulatedTenantId = headersList.get('x-simulated-tenant-id') || ''
  const simulatedTenantName = headersList.get('x-simulated-tenant-name') || undefined
  const simulatedTenantType = headersList.get('x-simulated-tenant-type') || undefined

  // isSuperAdmin is true iff the user's role is SUPER_ADMIN AND no simulation cookie is active.
  // When simulating, the user effectively becomes a tenant-scoped user (isSuperAdmin=false)
  // so that admin-only routes are not callable from within the simulation.
  const isSimulating = role === 'SUPER_ADMIN' && simulatedTenantId.length > 0
  const isSuperAdmin = role === 'SUPER_ADMIN' && !isSimulating

  // Validate: non-super-admin must have a tenantId
  if (!isSuperAdmin && !tenantId) {
    console.warn('[TenantContext] Non-super-admin user has no tenantId — queries will return empty')
  }

  return {
    userId,
    role,
    tenantId,
    tenantScope: isSuperAdmin ? [] : tenantScope.split(',').filter(Boolean),
    isSuperAdmin,
    isSimulating,
    simulatedTenantId: isSimulating ? simulatedTenantId : undefined,
    simulatedTenantName: isSimulating ? simulatedTenantName : undefined,
    simulatedTenantType: isSimulating ? simulatedTenantType : undefined,
  }
}

/**
 * Build a Prisma where clause for tenant-scoped queries.
 * Returns an empty object for SUPER_ADMIN (no filtering),
 * or an `in` filter for the allowed tenant IDs.
 *
 * @param field - The Prisma field name to filter on (default: 'tenantId')
 *
 * @example
 * ```ts
 * const ctx = await getTenantContext()
 * const data = await db.farmerProfile.findMany({
 *   where: { ...ctx.tenantFilter() },
 * })
 * ```
 */
export function buildTenantFilter(ctx: TenantContext, field: string = 'tenantId'): Record<string, unknown> {
  if (ctx.isSuperAdmin || ctx.tenantScope.length === 0) {
    return {} // No filtering for super admin
  }
  return { [field]: { in: ctx.tenantScope } }
}

/**
 * Get all descendant tenant IDs for a given tenant (recursive).
 * Uses iterative approach to avoid stack overflow on deep hierarchies.
 *
 * For PostgreSQL production, this should use a CTE query.
 * For SQLite dev, this does in-memory traversal.
 */
export async function getDescendantTenantIds(tenantId: string): Promise<string[]> {
  const ids: string[] = [tenantId]

  // Fetch all tenants to build in-memory tree
  const allTenants = await db.tenant.findMany({
    select: { id: true, parentId: true },
  })

  // Build children map
  const childrenMap = new Map<string, string[]>()
  for (const t of allTenants) {
    if (t.parentId) {
      const siblings = childrenMap.get(t.parentId) || []
      siblings.push(t.id)
      childrenMap.set(t.parentId, siblings)
    }
  }

  // BFS to find all descendants
  const queue = [tenantId]
  while (queue.length > 0) {
    const current = queue.shift()!
    const children = childrenMap.get(current) || []
    for (const childId of children) {
      if (!ids.includes(childId)) {
        ids.push(childId)
        queue.push(childId)
      }
    }
  }

  return ids
}

/**
 * Augment TenantContext with a tenantFilter helper method.
 * Allows: `ctx.tenantFilter()` or `ctx.tenantFilter('farmer.tenantId')`
 */
export function createTenantContextWithHelper(ctx: TenantContext): TenantContext & {
  tenantFilter: (field?: string) => Record<string, unknown>
} {
  return {
    ...ctx,
    tenantFilter: (field = 'tenantId') => buildTenantFilter(ctx, field),
  }
}