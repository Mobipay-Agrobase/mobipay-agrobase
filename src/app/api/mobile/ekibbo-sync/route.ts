import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { generateFarmerCode } from '@/lib/farmer-code'
import { resolveFarmerByNumericId, numericId } from '@/lib/mobile/ekibbo-adapter'

/**
 * /api/mobile/ekibbo-sync
 *
 * GET  ?deviceId=xxx&limit=100 — sync audit history for the device (every
 *      push attempt with success/failure + reason) for the app's Sync screen.
 *
 * POST — batch push of records captured OFFLINE (auto-triggered by the app
 *      when connectivity returns, or manually). Each item is processed
 *      independently — one failure never blocks the others — and every
 *      attempt is written to SyncAuditLog.
 *
 *      Body: { deviceId, items: [ { localId, type: 'farmer', payload } ] }
 *      → { result, synced, failed, results: [ { localId, ok, error?, farmerCode?, remoteId? } ] }
 */

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get('deviceId') || ''
    const limit = Math.min(200, parseInt(searchParams.get('limit') || '100'))

    const where: Record<string, unknown> = { ...tf }
    if (deviceId) where.deviceId = deviceId

    const logs = await db.syncAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      result: true,
      data: logs,
      summary: {
        total: logs.length,
        success: logs.filter(l => l.status === 'SUCCESS').length,
        failed: logs.filter(l => l.status === 'FAILED').length,
      },
    })
  } catch (error) {
    console.error('[ekibbo-sync GET]', error)
    return NextResponse.json({ result: false, message: 'Failed to load sync log' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!ctx.tenantId) {
      return NextResponse.json({ result: false, message: 'No tenant context' }, { status: 400 })
    }
    const tf = buildTenantFilter(ctx, 'tenantId')

    const body = await req.json().catch(() => ({}))
    const deviceId = String(body.deviceId || 'unknown-device')
    const items: Array<{ localId?: number; type?: string; payload?: Record<string, string> }> =
      Array.isArray(body.items) ? body.items : []

    if (!items.length) {
      return NextResponse.json({ result: true, synced: 0, failed: 0, results: [] })
    }

    const results: Array<Record<string, unknown>> = []

    for (const item of items) {
      const localId = item.localId ?? 0
      try {
        if (item.type !== 'farmer') {
          throw new Error(`Unsupported sync type: ${item.type}`)
        }
        const p = item.payload || {}
        const fullName = (p['full_name'] || p['name'] || '').trim()
        if (!fullName) throw new Error('full_name is required')
        const phone = (p['phone_number'] || p['phone'] || '').trim()
        if (!phone) throw new Error('phone_number is required')

        const parts = fullName.split(/\s+/)
        const lastName = parts.length > 1 ? parts.pop()! : ''
        const firstName = parts.join(' ') || fullName

        // UPDATE flow (re-sync of an edited offline farmer)
        const farmerIdRaw = p['farmer_id']
        if (farmerIdRaw && farmerIdRaw !== '0' && farmerIdRaw !== 'null') {
          const existing = await resolveFarmerByNumericId(tf, parseInt(farmerIdRaw, 10) || 0)
          if (existing) {
            await db.farmerProfile.update({
              where: { id: existing.id },
              data: {
                firstName, lastName, phone,
                gender: p['gender'] || undefined,
                education: p['education'] || undefined,
                maritalStatus: p['marital_status'] || undefined,
                email: p['email'] || undefined,
                dateOfBirth: p['dob'] ? new Date(p['dob']) : undefined,
                nationalIdType: p['identity_proof'] || p['national_id_type'] || undefined,
                nationalIdNo: p['proof_no'] || p['national_id_no'] || undefined,
                spouseName: p['spouse_name'] || undefined,
                familyMembers: p['family_members'] ? parseInt(p['family_members']) : undefined,
                childrenUnder18: p['children_under_18'] ? parseInt(p['children_under_18']) : undefined,
                schoolGoingChildren: p['school_going_children'] ? parseInt(p['school_going_children']) : undefined,
                villageName: p['village'] || p['village_name'] || undefined,
                district: p['district_name'] || undefined,
                commune: p['commune_name'] || p['sub_county_name'] || undefined,
                gpsLatitude: p['lat'] ? parseFloat(p['lat']) : undefined,
                gpsLongitude: p['lng'] ? parseFloat(p['lng']) : undefined,
              },
            })
            results.push({ localId, ok: true, updated: true, remoteId: numericId(existing.id), farmerCode: existing.farmerCode })
            await writeAudit(ctx.tenantId!, deviceId, localId, 'farmer', 'SUCCESS', existing.id, null)
            continue
          }
        }

        // CREATE flow
        const farmerCode = await generateFarmerCode(ctx.tenantId, null, {
          district: p['district_name'] || null,
          subCounty: p['commune_name'] || p['sub_county_name'] || null,
          village: p['village'] || p['village_name'] || null,
        })

        const created = await db.farmerProfile.create({
          data: {
            tenantId: ctx.tenantId!,
            farmerCode,
            firstName, lastName, phone,
            gender: p['gender'] || null,
            education: p['education'] || null,
            maritalStatus: p['marital_status'] || null,
            email: p['email'] || null,
            dateOfBirth: p['dob'] ? new Date(p['dob']) : null,
            nationalIdType: p['identity_proof'] || p['national_id_type'] || null,
            nationalIdNo: p['proof_no'] || p['national_id_no'] || null,
            spouseName: p['spouse_name'] || null,
            familyMembers: p['family_members'] ? parseInt(p['family_members']) : null,
            childrenUnder18: p['children_under_18'] ? parseInt(p['children_under_18']) : null,
            schoolGoingChildren: p['school_going_children'] ? parseInt(p['school_going_children']) : null,
            housingOwnership: p['housing_ownership'] || null,
            houseType: p['house_type'] || null,
            villageName: p['village'] || p['village_name'] || null,
            district: p['district_name'] || null,
            commune: p['commune_name'] || p['sub_county_name'] || null,
            gpsLatitude: p['lat'] ? parseFloat(p['lat']) : null,
            gpsLongitude: p['lng'] ? parseFloat(p['lng']) : null,
            photoUrl: p['farmer_photo'] || null,
            enrollmentDate: p['enrollment_date'] ? new Date(p['enrollment_date']) : new Date(),
            enrollmentPlace: p['enrollment_place'] || null,
            farmerRegistrationUnder: p['farmer_registration_under'] || null,
            memberType: 'General',
            status: 'ACTIVE',
          },
        })

        results.push({ localId, ok: true, updated: false, remoteId: numericId(created.id), farmerCode })
        await writeAudit(ctx.tenantId!, deviceId, localId, 'farmer', 'SUCCESS', created.id, null)
      } catch (e: any) {
        const msg = e?.message || 'Sync failed'
        results.push({ localId, ok: false, error: msg })
        await writeAudit(ctx.tenantId!, deviceId, localId, item.type || 'unknown', 'FAILED', null, msg)
      }
    }

    const synced = results.filter(r => r.ok).length
    return NextResponse.json({
      result: true,
      synced,
      failed: results.length - synced,
      results,
    })
  } catch (error: any) {
    console.error('[ekibbo-sync]', error)
    return NextResponse.json({ result: false, message: 'Sync failed', detail: error.message }, { status: 500 })
  }
}

/** Append-only sync audit trail (also surfaced in the app's Sync screen). */
async function writeAudit(
  tenantId: string,
  deviceId: string,
  localId: number,
  type: string,
  status: 'SUCCESS' | 'FAILED',
  remoteId: string | null,
  error: string | null,
) {
  try {
    await db.syncAuditLog.create({
      data: { tenantId, deviceId, localId: String(localId), type, status, remoteId, error },
    })
  } catch (e) {
    console.error('[ekibbo-sync] audit write failed', e)
  }
}
