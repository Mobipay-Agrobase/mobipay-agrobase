import { db } from '@/lib/db'
import { decryptField } from '@/lib/security/field-crypto'

/**
 * Ekibbo mobile adapter — translates Agrobase data into the upstream
 * mobile-app JSON shapes so the Flutter client works unchanged.
 *
 * ID BRIDGE
 * ─────────
 * The upstream app models farmer IDs as integers; Agrobase uses cuid
 * strings. `numericId(cuid)` derives a stable 64-bit int from the first 8
 * base-36 chars of the cuid (unique in practice — cuid prefixes embed
 * timestamp+counter). `resolveFarmerByNumericId()` reverses it by scanning
 * the tenant's farmers once (mobile-scale volumes).
 *
 * TENANT ISOLATION
 * ─────────────────
 * Every helper takes a tenant `where` filter built from the request's
 * Bearer-token context (see getTenantContext / buildTenantFilter). A user
 * of one tenant can never resolve or list another tenant's farmers.
 */

/**
 * Stable 52-bit numeric id derived from the FULL cuid, using two salted
 * FNV-1a 32-bit hashes combined as h1·2²¹ | h2(21 bits). Pure Number math
 * (Math.imul) — no BigInt, exact in JSON/JS (≤2⁵³) and Dart int (64-bit).
 * Collision odds across a tenant's few thousand records are negligible,
 * and `resolveFarmerByNumericId()` scans the tenant's actual records so a
 * collision is detected (multiple matches) and rejected rather than
 * silently returning the wrong farmer.
 *
 * NOTE: a naive `parseInt(cuid.slice(0, 8), 36)` collides systematically for
 * batch-seeded cuids (same timestamp prefix) — do not use it.
 */
function fnv1a32(s: string, seed: number): number {
  let h = seed >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

export function numericId(cuid: string): number {
  const h1 = fnv1a32(cuid, 0x811c9dc5)
  const h2 = fnv1a32(cuid, 0x9747b28c)
  return h1 * 2097152 + (h2 & 0x1fffff) // h1·2^21 + 21 bits of h2 = 53 bits
}

interface FarmerWithLands {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  email?: string | null
  gender?: string | null
  dateOfBirth?: Date | null
  farmerCode?: string | null
  photoUrl?: string | null
  nationalIdType?: string | null
  nationalIdNo?: string | null
  enrollmentDate?: Date | null
  enrollmentPlace?: string | null
  villageName?: string | null
  district?: string | null
  commune?: string | null
  province?: string | null
  gpsLatitude?: number | null
  gpsLongitude?: number | null
  createdAt: Date
  updatedAt: Date
  status?: string
  isCertified?: boolean
  cooperativeId?: string | null
  groupId?: string | null
  farms?: Array<{ id: string; name: string; sizeHectares: number | null }> | null
}

function safePhone(f: FarmerWithLands): string {
  if (!f.phone) return ''
  return f.phone.startsWith('enc:v1:') ? (decryptField(f.phone) || '') : f.phone
}

/** Map an Agrobase farmer to the upstream FarmerModel JSON shape. */
export function mapFarmer(f: FarmerWithLands): Record<string, unknown> {
  const lands = f.farms ?? []
  const totalArea = lands.reduce((s, l) => s + (Number(l.sizeHectares) || 0), 0)
  return {
    id: numericId(f.id),
    user_id: 0,
    staff_id: 0,
    enrollment_date: f.enrollmentDate ? f.enrollmentDate.toISOString().split('T')[0] : null,
    enrollment_place: f.enrollmentPlace,
    full_name: `${f.firstName} ${f.lastName}`.trim(),
    phone_number: safePhone(f),
    identity_proof: f.nationalIdType,
    proof_no: f.nationalIdNo && f.nationalIdNo.startsWith('enc:v1:') ? decryptField(f.nationalIdNo) : f.nationalIdNo,
    country: 0,
    province: 0,
    district: 0,
    commune: 0,
    village: f.villageName,
    lng: f.gpsLongitude != null ? String(f.gpsLongitude) : null,
    lat: f.gpsLatitude != null ? String(f.gpsLatitude) : null,
    gender: f.gender,
    dob: f.dateOfBirth ? f.dateOfBirth.toISOString().split('T')[0] : null,
    farmer_code: f.farmerCode,
    farmer_photo: f.photoUrl,
    avatar_url: f.photoUrl,
    id_proof_photo_url: [],
    created_at: f.createdAt.toISOString(),
    farm_lands: (lands).map(l => ({
      id: numericId(l.id),
      farm_name: l.name,
      farmer_id: numericId(f.id),
      total_land_holding: Number(l.sizeHectares) || 0,
      total_cultivation: 0,
      actual_area: String(l.sizeHectares ?? 0),
      // The upstream FarmLandModel parser casts these NON-nullably
      // (`json['tag'] as String`); omitting them crashes the whole
      // dashboard parse — always include them.
      tag: '',
      listLatLng: '',
    })),
    total_area: totalArea,
    farm_lands_count: lands.length,
    srp_certification: f.isCertified ? 1 : 0,
    cooperative_id: 0,
  }
}

const FARMER_SELECT = {
  id: true, firstName: true, lastName: true, phone: true, gender: true,
  dateOfBirth: true, farmerCode: true, photoUrl: true, nationalIdType: true,
  nationalIdNo: true, enrollmentDate: true, enrollmentPlace: true,
  villageName: true, district: true, commune: true, province: true,
  gpsLatitude: true, gpsLongitude: true, createdAt: true, updatedAt: true,
  status: true, isCertified: true,
  farms: { select: { id: true, name: true, sizeHectares: true } },
} as const

/** Resolve a numeric (upstream) farmer id back to the Agrobase record,
 *  scoped to the tenant filter. Returns null when not found — or when the
 *  hash collides across two records (astronomically rare), in which case we
 *  refuse to guess rather than return the wrong farmer. */
export async function resolveFarmerByNumericId(
  where: Record<string, unknown>,
  numId: number,
): Promise<FarmerWithLands | null> {
  const farmers = await db.farmerProfile.findMany({
    where: where as any,
    select: FARMER_SELECT,
    take: 5000,
  })
  const matches = farmers.filter(f => numericId(f.id) === numId)
  return matches.length === 1 ? (matches[0] as FarmerWithLands) : null
}

/** Standard farmer query select (with farm lands) for list/detail/home. */
export const farmerSelect = FARMER_SELECT
