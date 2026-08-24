import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId } from '@/lib/mobile/ekibbo-adapter'

/**
 * POST /api/add_crops
 *
 * Mobile Add-Crop submit (multipart form — the upstream app's legacy path).
 * Creates a Cultivation row on the WEB PLATFORM (same table as the web
 * cultivation form), so mobile-created crops appear in the web list and
 * vice-versa. Accepts:
 *   farmer_id      numeric farmer id
 *   farm_land_id   numeric farm land id
 *   crop_master_id numeric CropMaster id
 *   season_id      numeric SeasonMaster id
 *   crop_variety   variety name (string)
 *   sowing_date    dd/MM/yyyy
 *   est_yield      kg (string)
 *   staff_lat/lng  officer GPS (accepted, informational)
 *   photo[]        optional images (stored as photoUrl of the first)
 *
 * NOTE: `expect_date` is accepted but not persisted — the web cultivation
 * model has no expected-harvest field, matching the web form exactly.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')

    const form = await req.formData()
    const str = (k: string) => String(form.get(k) ?? '').trim()
    const farmerNumId = parseInt(str('farmer_id'), 10)
    const farmNumId = parseInt(str('farm_land_id'), 10)
    const cropNumId = parseInt(str('crop_master_id'), 10)
    const seasonNumId = parseInt(str('season_id'), 10)
    const variety = str('crop_variety')
    const estYield = parseFloat(str('est_yield'))

    if (Number.isNaN(farmNumId) || Number.isNaN(cropNumId)) {
      return NextResponse.json(
        { result: false, message: 'farm_land_id and crop_master_id are required' },
        { status: 400 },
      )
    }

    // Resolve the numeric farm id inside the tenant scope.
    const farms = await db.farmLand.findMany({
      where: { farmer: { ...tf } },
      select: { id: true },
      take: 10000,
    })
    const farm = farms.find(f => numericId(f.id) === farmNumId)
    if (!farm) {
      return NextResponse.json({ result: false, message: 'Farm land not found' }, { status: 404 })
    }

    // Resolve crop + season names from the masters.
    const [cropMaster, seasons] = await Promise.all([
      db.cropMaster.findMany({ select: { id: true, name: true }, take: 500 }),
      db.seasonMaster.findMany({ select: { id: true, name: true }, take: 100 }),
    ])
    const crop = cropMaster.find(c => numericId(c.id) === cropNumId)
    const season = seasons.find(s => numericId(s.id) === seasonNumId)
    if (!crop) {
      return NextResponse.json({ result: false, message: 'Crop not found in Crop Master' }, { status: 404 })
    }

    const sowingDateRaw = str('sowing_date')
    const sowingDate = parseDdMmYyyy(sowingDateRaw)

    const created = await db.cultivation.create({
      data: {
        farmId: farm.id,
        cropName: crop.name,
        variety: variety || null,
        season: season?.name ?? null,
        sowingDate: sowingDateValid(sowingDateRaw) ? sowingDate : null,
        estimatedYield: Number.isNaN(estYield) ? null : estYield,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({
      result: true,
      message: 'Crop created successfully',
      data: { id: numericId(created.id), crop_name: created.cropName },
    })
  } catch (error: any) {
    console.error('[add_crops]', error)
    return NextResponse.json({ result: false, message: 'Failed to create crop' }, { status: 500 })
  }
}

/** Parse "dd/MM/yyyy" → Date (invalid → epoch sentinel). */
function parseDdMmYyyy(s: string): Date {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return new Date(0)
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
}

function sowingDateValid(s: string): boolean {
  return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)
}
