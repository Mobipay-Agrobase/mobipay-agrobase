import { db } from '@/lib/db'

/**
 * Ekibbo mobile helpers — geo numeric-id resolution + mobile role gating.
 *
 * Geo records use the same 52-bit FNV hash scheme as farmers (see
 * ekibbo-adapter.ts numericId). Because hashing is not prefix-reversible,
 * parent lookups scan the parent table and match hashes — mobile-scale
 * volumes make this cheap.
 */

/** Resolve a numeric id to the record whose cuid hashes to it. */
export async function resolveByNumericId<T extends { id: string }>(
  rows: T[],
  numId: number,
): Promise<T | null> {
  const { numericId } = await import('./ekibbo-adapter')
  const matches = rows.filter(r => numericId(r.id) === numId)
  return matches.length === 1 ? matches[0] : null
}

/**
 * Mobile role gate (defense-in-depth on top of tenant isolation).
 *
 * The upstream app's Field Officer screens (farmer registry, dashboard,
 * geo cascade, cooperatives) are staff-facing. Ekibbo farmer accounts use
 * the farmer dashboard + /me endpoints instead. Mirror the web RBAC:
 * EKB_FARMER has no farmers:list permission.
 */
const STAFF_ROLES = new Set([
  'EKB_EXTENSION', 'EKB_OPS_MANAGER', 'EKB_MD', 'EKB_FIN_ASSISTANT',
  'TENANT_ADMIN', 'COUNTRY_ADMIN', 'SUPER_ADMIN',
])

export function isMobileStaff(role: string | undefined): boolean {
  return !!role && STAFF_ROLES.has(role)
}

// ── Farmer self-scope guard ────────────────────────────────────────────────

const FARMER_ROLES = new Set(['EKB_FARMER', 'FARMER', 'VSLA_MEMBER'])

/** Farmer self-service roles (EKB_FARMER + generic FARMER/VSLA_MEMBER). */
export function isFarmerRole(role: string | undefined): boolean {
  return !!role && FARMER_ROLES.has(role)
}

/**
 * Farmer self-scope guard (defense-in-depth on top of tenant isolation).
 *
 * Farmer roles are SELF-SERVICE: they may only reach their OWN farmer
 * profile and its farm lands — mirroring the web RBAC (EKB_FARMER has no
 * farmers:list). Without this, a farmer token could read/edit ANY farmer's
 * profile, tabs (bank/finance info), farm lands and cultivations inside the
 * tenant by guessing or obtaining another farmer's numeric id (e.g. from a
 * shared QR ID card). Staff roles pass through unchanged — tenant isolation
 * already scopes them.
 *
 * Returns true when the caller may access `targetFarmerId`.
 */
export async function farmerSelfAccess(
  ctx: { role?: string; userId?: string },
  targetFarmerId: string | null | undefined,
): Promise<boolean> {
  if (!isFarmerRole(ctx?.role)) return true
  if (!ctx?.userId || !targetFarmerId) return false
  const own = await db.farmerProfile.findFirst({
    where: { id: targetFarmerId, userId: ctx.userId },
    select: { id: true },
  })
  return !!own
}
