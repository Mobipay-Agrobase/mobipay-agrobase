import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { decryptField } from '@/lib/security/field-crypto'

/**
 * GET /api/data-quality
 *
 * Returns data-quality issues for the current tenant:
 *   - duplicatePhones:   farmers sharing the same phone number
 *   - missingNames:      farmers with empty firstName or lastName
 *   - missingPhone:      farmers with empty/invalid phone
 *   - missingLocation:   farmers with no district + no village
 *   - missingFarmSize:   farmers with no farmSize
 *   - missingFarmLand:   farmers with zero FarmLand records
 *   - invalidGps:        farmers with GPS lat/lng out of range (-90..90, -180..180)
 *   - unreadablePii:     farmers whose encrypted phone / national ID can no
 *                        longer be decrypted (rotated/lost key) — the values
 *                        render masked ("—") in the UI; staff should re-enter
 *                        them on the farmer profile (PUT accepts new values).
 *
 * Each issue returns an array of farmer records with the relevant fields.
 */
export async function GET() {
  try {
    const ctx = await getTenantContext()
    const tf = buildTenantFilter(ctx, 'tenantId')

    const farmers = await db.farmerProfile.findMany({
      where: tf,
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        nationalIdNo: true,
        district: true, villageName: true, commune: true,
        farmSize: true, gpsLatitude: true, gpsLongitude: true,
        status: true, farmerCode: true, userId: true,
        createdAt: true,
        _count: { select: { farms: true } },
      },
      take: 5000,
    })

    const duplicatePhones: Array<{ phone: string; count: number; farmers: any[] }> = []
    const phoneMap: Record<string, any[]> = {}
    for (const f of farmers) {
      if (!f.phone) continue
      const ph = f.phone.startsWith('enc:v1:') ? '(encrypted)' : f.phone
      if (!phoneMap[ph]) phoneMap[ph] = []
      phoneMap[ph].push(f)
    }
    for (const [phone, list] of Object.entries(phoneMap)) {
      if (list.length > 1) duplicatePhones.push({ phone, count: list.length, farmers: list.slice(0, 10) })
    }

    const missingNames = farmers.filter(f => !f.firstName || !f.lastName)
    const missingPhone = farmers.filter(f => !f.phone || f.phone.length < 6)
    const missingLocation = farmers.filter(f => !f.district && !f.villageName && !f.commune)
    const missingFarmSize = farmers.filter(f => f.farmSize == null || f.farmSize === 0)
    const missingFarmLand = farmers.filter(f => f._count.farms === 0)
    const invalidGps = farmers.filter(f => {
      if (f.gpsLatitude == null && f.gpsLongitude == null) return false
      const lat = f.gpsLatitude ?? 0
      const lng = f.gpsLongitude ?? 0
      return lat < -90 || lat > 90 || lng < -180 || lng > 180
    })

    // ── Unreadable PII worklist ──────────────────────────────────────────
    // decryptField tries the current key + every legacy dev key; a value
    // that STILL fails after all candidates is unrecoverable (the writing
    // key was rotated or lost). Surface those farmers so staff re-enter
    // the contact / ID on the profile (the PUT accepts fresh values — only
    // null/'' wipes are blocked by the round-trip protection).
    const unreadablePii = farmers
      .map(f => {
        const unreadableFields: string[] = []
        if (f.phone && f.phone.startsWith('enc:v1:') && decryptField(f.phone) == null) {
          unreadableFields.push('phone')
        }
        if (f.nationalIdNo && f.nationalIdNo.startsWith('enc:v1:') && decryptField(f.nationalIdNo) == null) {
          unreadableFields.push('nationalIdNo')
        }
        return unreadableFields.length > 0 ? { farmer: f, fields: unreadableFields } : null
      })
      .filter((x): x is { farmer: typeof farmers[number]; fields: string[] } => x !== null)

    const issues = [
      { key: 'duplicatePhones', label: 'Duplicate Phone Numbers', severity: 'high', count: duplicatePhones.length, totalFarmers: duplicatePhones.reduce((s, d) => s + d.count, 0), data: duplicatePhones },
      { key: 'missingNames', label: 'Missing First/Last Name', severity: 'high', count: missingNames.length, totalFarmers: missingNames.length, data: missingNames.slice(0, 50) },
      { key: 'missingPhone', label: 'Missing/Invalid Phone', severity: 'high', count: missingPhone.length, totalFarmers: missingPhone.length, data: missingPhone.slice(0, 50) },
      { key: 'unreadablePii', label: 'Unreadable PII — re-capture needed', severity: 'high', count: unreadablePii.length, totalFarmers: unreadablePii.length, data: unreadablePii.slice(0, 50).map(u => ({ ...u.farmer, unreadablePiiFields: u.fields })) },
      { key: 'missingLocation', label: 'Missing Location (District + Village)', severity: 'medium', count: missingLocation.length, totalFarmers: missingLocation.length, data: missingLocation.slice(0, 50) },
      { key: 'missingFarmSize', label: 'Missing Farm Size', severity: 'medium', count: missingFarmSize.length, totalFarmers: missingFarmSize.length, data: missingFarmSize.slice(0, 50) },
      { key: 'missingFarmLand', label: 'No Farm Land Registered', severity: 'low', count: missingFarmLand.length, totalFarmers: missingFarmLand.length, data: missingFarmLand.slice(0, 50) },
      { key: 'invalidGps', label: 'Invalid GPS Coordinates', severity: 'low', count: invalidGps.length, totalFarmers: invalidGps.length, data: invalidGps.slice(0, 50) },
    ]

    const totalIssues = issues.reduce((s, i) => s + i.count, 0)
    const totalFarmers = farmers.length
    const healthScore = totalFarmers > 0 ? Math.max(0, Math.round(((totalFarmers - missingNames.length - missingPhone.length - missingLocation.length) / totalFarmers) * 100)) : 100

    return NextResponse.json({
      totalFarmers,
      totalIssues,
      healthScore,
      issues,
    })
  } catch (error) {
    console.error('[data-quality] error:', error)
    return NextResponse.json({ error: 'Failed to compute data quality' }, { status: 500 })
  }
}
