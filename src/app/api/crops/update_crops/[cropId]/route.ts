import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId } from '@/lib/mobile/ekibbo-adapter'

/**
 * POST /api/crops/update_crops/[cropId]
 *
 * Mobile Edit-Crop submit (multipart). Updates the WEB PLATFORM Cultivation
 * row — same fields as /api/add_crops.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cropId?: string }> },
) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const p = params ? await params : {}
    const cropNumId = p.cropId ? parseInt(p.cropId, 10) : NaN
    if (Number.isNaN(cropNumId)) {
      return NextResponse.json({ result: false, message: 'Invalid crop id' }, { status: 400 })
    }

    // Resolve the numeric crop id inside the tenant scope.
    const rows = await db.cultivation.findMany({
      where: { farm: { farmer: { ...tf } } },
      select: { id: true },
      take: 20000,
    })
    const existing = rows.find(r => numericId(r.id) === cropNumId)
    if (!existing) {
      return NextResponse.json({ result: false, message: 'Cultivation not found' }, { status: 404 })
    }

    const form = await req.formData()
    const str = (k: string) => String(form.get(k) ?? '').trim()
    const farmNumId = parseInt(str('farm_land_id'), 10)
    const cropNumMasterId = parseInt(str('crop_master_id'), 10)
    const seasonNumId = parseInt(str('season_id'), 10)
    const variety = str('crop_variety')
    const estYield = parseFloat(str('est_yield'))

    const data: Record<string, unknown> = {}
    if (variety) data.variety = variety
    if (!Number.isNaN(estYield)) data.estimatedYield = estYield

    if (!Number.isNaN(farmNumId)) {
      const farms = await db.farmLand.findMany({
        where: { farmer: { ...tf } },
        select: { id: true },
        take: 10000,
      })
      const farm = farms.find(f => numericId(f.id) === farmNumId)
      if (farm) data.farmId = farm.id
    }
    if (!Number.isNaN(cropNumMasterId)) {
      const crops = await db.cropMaster.findMany({ select: { id: true, name: true }, take: 500 })
      const crop = crops.find(c => numericId(c.id) === cropNumMasterId)
      if (crop) data.cropName = crop.name
    }
    if (!Number.isNaN(seasonNumId)) {
      const seasons = await db.seasonMaster.findMany({ select: { id: true, name: true }, take: 100 })
      const season = seasons.find(s => numericId(s.id) === seasonNumId)
      if (season) data.season = season.name
    }
    const sowingDateRaw = str('sowing_date')
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(sowingDateRaw)) {
      const m = sowingDateRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)!
      data.sowingDate = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
    }

    await db.cultivation.update({ where: { id: existing.id }, data })

    return NextResponse.json({
      result: true,
      message: 'Crop updated successfully',
      data: { id: cropNumId },
    })
  } catch (error: any) {
    console.error('[update_crops]', error)
    return NextResponse.json({ result: false, message: 'Failed to update crop' }, { status: 500 })
  }
}
