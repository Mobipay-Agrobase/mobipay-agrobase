/**
 * Tenant-aware farmer code generation.
 *
 * Each tenant gets a distinctive prefix derived from its name, so farmer codes
 * are visually identifiable by tenant:
 *   EKIBBO          → EKB-00001
 *   SAA-WFP-AMS     → SAA-00001
 *   Kilimo Trust    → KIL-00001
 *   MobiPay         → MP-00001
 *
 * Special cases:
 *   - If tenant name already contains a recognized acronym (EKB, SAA, etc.), use it.
 *   - If name has multiple words, take first letters of first two words.
 *   - Falls back to "FRM" if no tenant context.
 *
 * Format: <PREFIX>-<ZERO_PADDED_SEQUENCE>
 * Sequence is scoped per-tenant (count of existing farmers in that tenant + 1).
 */
import { db } from '@/lib/db'

// Well-known tenant acronyms — checked first against tenant name
const KNOWN_ACRONYMS: Array<{ match: RegExp; prefix: string }> = [
  { match: /ekibbo|ekb/i, prefix: 'EKB' },
  { match: /saa|wfp/i, prefix: 'SAA' },
  { match: /kilimo/i, prefix: 'KIL' },
  { match: /mobipay/i, prefix: 'MP' },
  { match: /reset/i, prefix: 'RST' },
  { match: /nssf/i, prefix: 'NSSF' },
  { match: /agrobase/i, prefix: 'AGB' },
]

/**
 * Derive a 2-4 char uppercase prefix from a tenant name.
 */
export function deriveTenantPrefix(tenantName: string): string {
  if (!tenantName) return 'FRM'

  // 1. Check well-known acronyms first
  for (const a of KNOWN_ACRONYMS) {
    if (a.match.test(tenantName)) return a.prefix
  }

  // 2. Take first letter of each word, max 4 chars, uppercase
  const words = tenantName.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'FRM'
  if (words.length === 1) {
    // Single word: take first 3 chars
    const w = words[0].toUpperCase().replace(/[^A-Z0-9]/g, '')
    return w.slice(0, 3) || 'FRM'
  }
  // Multiple words: take first letter of each, max 4
  const initials = words.map(w => w[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return initials.slice(0, 4) || 'FRM'
}

/**
 * Generate the next farmer code for a tenant.
 *
 * Sequence is per-tenant: counts existing farmers in that tenant + 1, zero-padded to 5 digits.
 * Format: <PREFIX>-<NNNNN>  (e.g. EKB-00001, SAA-00042)
 *
 * If `explicitCode` is provided (from the API caller), use it as-is.
 * If no tenantId, fall back to legacy "FRM-NNNNN" format.
 */
export async function generateFarmerCode(
  tenantId: string | undefined | null,
  explicitCode?: string | null,
): Promise<string> {
  if (explicitCode && explicitCode.trim()) return explicitCode.trim()

  if (!tenantId) {
    // No tenant context — legacy global sequence
    const count = await db.farmerProfile.count()
    return `FRM-${String(count + 1).padStart(5, '0')}`
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  })
  const prefix = deriveTenantPrefix(tenant?.name || '')

  // Per-tenant sequence
  const tenantFarmerCount = await db.farmerProfile.count({ where: { tenantId } })
  return `${prefix}-${String(tenantFarmerCount + 1).padStart(5, '0')}`
}
