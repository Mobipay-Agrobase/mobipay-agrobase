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
