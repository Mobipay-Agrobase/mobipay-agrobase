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
 * EKIBBO LOCATION-BASED FORMAT (Ekibbo guidance, Aug 2026):
 *   "MN0001L" where M = Mukono (District), N = Nakisunga (Subcounty),
 *   0001 = per-village sequence, L = Lugala (Village).
 *   Applied when district + subcounty + village are all provided on the
 *   Ekibbo tenant; sequence is scoped per District|Subcounty|Village combo.
 *
 * If `explicitCode` is provided (from the API caller), use it as-is.
 * If no tenantId, fall back to legacy "FRM-NNNNN" format.
 */
export interface FarmerCodeLocation {
  district?: string | null
  subCounty?: string | null   // stored as `commune` on FarmerProfile
  village?: string | null     // stored as `villageName` on FarmerProfile
}

/** Take the first letter of a location name, uppercased, A-Z only. */
function locationInitial(name?: string | null): string {
  if (!name) return ''
  const letter = name.trim().toUpperCase()[0] || ''
  return /[A-Z]/.test(letter) ? letter : ''
}

/**
 * Generate an EKIBBO location-based farmer code: <D><S><NNNN><V>
 *   D = first letter of District, S = first letter of Subcounty,
 *   NNNN = 4-digit sequence scoped to that D|S|V combination, V = first letter of Village.
 * Returns null when any of the three location parts is missing.
 */
export async function generateLocationBasedFarmerCode(
  tenantId: string,
  loc: FarmerCodeLocation,
): Promise<string | null> {
  const d = locationInitial(loc.district)
  const s = locationInitial(loc.subCounty)
  const v = locationInitial(loc.village)
  if (!d || !s || !v) return null

  const prefix = `${d}${s}`
  const suffix = v
  // Match codes like "MN0007L" for this exact district|subcounty|village combo
  const pattern = new RegExp(`^${prefix}(\\d{4,})${suffix}$`)

  const farmers = await db.farmerProfile.findMany({
    where: {
      tenantId,
      district: { equals: loc.district, mode: 'insensitive' },
      commune: { equals: loc.subCounty, mode: 'insensitive' },
      villageName: { equals: loc.village, mode: 'insensitive' },
      farmerCode: { not: null },
    },
    select: { farmerCode: true },
  })

  let max = 0
  for (const f of farmers) {
    const m = f.farmerCode?.match(pattern)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `${prefix}${String(max + 1).padStart(4, '0')}${suffix}`
}

export async function generateFarmerCode(
  tenantId: string | undefined | null,
  explicitCode?: string | null,
  location?: FarmerCodeLocation | null,
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
  const tenantName = tenant?.name || ''
  const prefix = deriveTenantPrefix(tenantName)

  // EKIBBO tenants use the location-based code when District/Subcounty/Village
  // are known (e.g. Mukono/Nakisunga/Lugalo → MN0001L)
  if (/ekibbo|ekb/i.test(tenantName) && location) {
    const locCode = await generateLocationBasedFarmerCode(tenantId, location)
    if (locCode) return locCode
  }

  // Per-tenant sequence
  const tenantFarmerCount = await db.farmerProfile.count({ where: { tenantId } })
  return `${prefix}-${String(tenantFarmerCount + 1).padStart(5, '0')}`
}
