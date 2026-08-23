import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { generateFarmerCode } from '@/lib/farmer-code'
import { resolveFarmerByNumericId, numericId } from '@/lib/mobile/ekibbo-adapter'

/**
 * POST /api/mobile/ekibbo-farmer  — register (or update) a farmer from the
 * mobile app. Accepts BOTH:
 *   • multipart/form-data (upstream offline-sync queue, with photos)
 *   • application/json (simple clients)
 *
 * Upstream field mapping:
 *   full_name      → firstName / lastName (split at last space)
 *   phone_number   → phone (encrypted at rest by /api/farmers parity rules)
 *   identity_proof → nationalIdType      proof_no → nationalIdNo
 *   village        → villageName          dob → dateOfBirth
 *   lat / lng      → gpsLatitude / gpsLongitude
 *   farmer_photo[] → photoUrl (embedded as data-URI; ≤ 2 MB each)
 *   farmer_id      → when present + resolvable → UPDATE instead of create
 *
 * Numeric geo ids (country/province/district/commune) have no Agrobase
 * equivalent in this payload and are ignored; location strings should be
 * sent as district_name / commune_name / village_name (optional, used for
 * the MN0001L farmer code when all three are present).
 *
 * Tenant-scoped via Bearer-token context — registrations always land in the
 * signed-in officer's tenant.
 */
const MAX_PHOTO_BYTES = 2 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const contentType = req.headers.get('content-type') || ''

    let fields: Record<string, string> = {}
    let photoDataUri: string | null = null

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      for (const [key, value] of form.entries()) {
        if (typeof value === 'string') {
          fields[key] = value
        } else if (key.startsWith('farmer_photo') && value.size > 0 && value.size <= MAX_PHOTO_BYTES) {
          const buf = Buffer.from(await value.arrayBuffer())
          photoDataUri = `data:${value.type || 'image/jpeg'};base64,${buf.toString('base64')}`
        }
      }
    } else {
      const body = await req.json().catch(() => ({}))
      for (const [k, v] of Object.entries(body)) {
        if (v != null) fields[k] = String(v)
      }
    }

    const fullName = (fields['full_name'] || fields['name'] || '').trim()
    if (!fullName) {
      return NextResponse.json({ result: false, message: 'full_name is required' }, { status: 400 })
    }
    const phone = (fields['phone_number'] || fields['phone'] || '').trim()
    if (!phone) {
      return NextResponse.json({ result: false, message: 'phone_number is required' }, { status: 400 })
    }

    // Split "First Middle Last" → first = all but last word, last = last word
    const parts = fullName.split(/\s+/)
    const lastName = parts.length > 1 ? parts.pop()! : ''
    const firstName = parts.join(' ') || fullName

    const districtName = fields['district_name'] || null
    const communeName = fields['commune_name'] || null
    const villageName = fields['village'] || fields['village_name'] || null

    // UPDATE flow (offline queue re-sync of an edited farmer)
    const farmerIdRaw = fields['farmer_id']
    if (farmerIdRaw && farmerIdRaw !== '0' && farmerIdRaw !== 'null') {
      const existing = await resolveFarmerByNumericId(tf, parseInt(farmerIdRaw, 10) || 0)
      if (existing) {
        await db.farmerProfile.update({
          where: { id: existing.id },
          data: {
            firstName,
            lastName,
            phone,
            gender: fields['gender'] || undefined,
            dateOfBirth: fields['dob'] ? new Date(fields['dob']) : undefined,
            nationalIdType: fields['identity_proof'] || undefined,
            nationalIdNo: fields['proof_no'] || undefined,
            villageName: villageName || undefined,
            district: districtName || undefined,
            commune: communeName || undefined,
            gpsLatitude: fields['lat'] ? parseFloat(fields['lat']) : undefined,
            gpsLongitude: fields['lng'] ? parseFloat(fields['lng']) : undefined,
            ...(photoDataUri ? { photoUrl: photoDataUri } : {}),
          },
        })
        return NextResponse.json({ result: true, message: 'Farmer updated' })
      }
      // Unresolvable id (e.g. cross-tenant or deleted) → fall through to create
    }

    // Farmer code: Ekibbo location-based (MN0001L) when all three location
    // parts are present, otherwise the tenant-prefix fallback (EKB-00001).
    const farmerCode = await generateFarmerCode(ctx.tenantId, null, {
      district: districtName,
      subCounty: communeName,
      village: villageName,
    })

    const created = await db.farmerProfile.create({
      data: {
        tenantId: ctx.tenantId!,
        farmerCode,
        firstName,
        lastName,
        phone,
        gender: fields['gender'] || null,
        dateOfBirth: fields['dob'] ? new Date(fields['dob']) : null,
        nationalIdType: fields['identity_proof'] || null,
        nationalIdNo: fields['proof_no'] || null,
        villageName,
        district: districtName,
        commune: communeName,
        gpsLatitude: fields['lat'] ? parseFloat(fields['lat']) : null,
        gpsLongitude: fields['lng'] ? parseFloat(fields['lng']) : null,
        photoUrl: photoDataUri,
        enrollmentDate: fields['enrollment_date'] ? new Date(fields['enrollment_date']) : new Date(),
        enrollmentPlace: fields['enrollment_place'] || null,
        memberType: 'General',
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({
      result: true,
      message: 'Farmer registered',
      data: { farmer_id: numericId(created.id), farmer_code: created.farmerCode },
    })
  } catch (error: any) {
    console.error('[ekibbo-farmer POST]', error)
    return NextResponse.json(
      { result: false, message: error?.message || 'Registration failed' },
      { status: 500 },
    )
  }
}
