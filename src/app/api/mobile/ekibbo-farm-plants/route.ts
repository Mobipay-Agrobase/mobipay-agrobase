import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId } from '@/lib/mobile/ekibbo-adapter'
import { farmerSelfAccess } from '@/lib/mobile/ekibbo-mobile-utils'
import { resolveCropMasterId } from '@/lib/farm-plant-crop-link'

/**
 * GET /api/mobile/ekibbo-farm-plants?farm_land_id={numericFarmId}
 *   Plant inventory rows for one farm, in the upstream JSON shape:
 *   { result, data: [{ id, crop_category, variety, plant_count, notes,
 *                      crop_master_name }] }
 *
 * POST /api/mobile/ekibbo-farm-plants (multipart or JSON)
 *   farm_land_id, crop_category, variety?, plant_count, notes?
 *   The server resolves the optional CropMaster link (name match) and
 *   stores cropMasterId alongside cropCategory.
 *
 * DELETE /api/mobile/ekibbo-farm-plants?id={numericPlantId}
 *
 * Second review (H): per-farm plant data entry feeding the "Total Plants"
 * registry KPI (Coffee–Robusta, Cocoa–Trinitario/Forastero/Criollo,
 * Vanilla, Shade Trees, Bananas, Jackfruit, Avocado, Cassava).
 * Staff roles: full access. Farmer roles: own farms only (self-scope).
 */
async function resolveFarmByNumericId(tf: Record<string, unknown>, numId: number) {
  const all = await db.farmLand.findMany({
    where: { farmer: { ...tf } },
    select: { id: true, farmerId: true },
    take: 5000,
  })
  return all.find(f => numericId(f.id) === numId) ?? null
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { searchParams } = new URL(req.url)
    const farmNumId = parseInt(searchParams.get('farm_land_id') || '', 10)

    if (Number.isNaN(farmNumId)) {
      return NextResponse.json({ result: false, message: 'farm_land_id is required' }, { status: 400 })
    }

    const farm = await resolveFarmByNumericId(tf, farmNumId)
    if (!farm) {
      return NextResponse.json({ result: false, message: 'Farm land not found' }, { status: 404 })
    }
    if (!(await farmerSelfAccess(ctx, farm.farmerId))) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }

    const plants = await db.farmPlant.findMany({
      where: { farmId: farm.id },
      orderBy: [{ cropCategory: 'asc' }, { createdAt: 'desc' }],
      include: { cropMaster: { select: { name: true } } },
    })

    return NextResponse.json({
      result: true,
      data: plants.map(p => ({
        id: numericId(p.id),
        farm_land_id: farmNumId,
        crop_category: p.cropCategory,
        variety: p.variety,
        plant_count: p.plantCount,
        notes: p.notes,
        // Crop Master link (null when the review category has no
        // CropMaster counterpart, e.g. Shade Trees / Bamboo seedlings).
        crop_master_name: p.cropMaster?.name ?? null,
      })),
    })
  } catch (error) {
    console.error('[ekibbo-farm-plants GET]', error)
    return NextResponse.json({ result: false, message: 'Failed to load plants' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')

    // Mobile sends multipart FormData; accept JSON too.
    const body: Record<string, any> = {}
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('multipart/form-data')) {
      const form = await req.formData()
      for (const [k, v] of form.entries()) {
        if (typeof v === 'string') body[k] = v
      }
    } else {
      Object.assign(body, await req.json().catch(() => ({})))
    }

    const farmNumId = parseInt(String(body.farm_land_id ?? ''), 10)
    const cropCategory = (body.crop_category ?? '').trim()
    const variety = body.variety != null ? String(body.variety).trim() : null
    const plantCount = parseInt(String(body.plant_count ?? '0'), 10)
    const notes = body.notes != null && String(body.notes).trim() !== '' ? String(body.notes).trim() : null

    if (Number.isNaN(farmNumId) || !cropCategory) {
      return NextResponse.json({ result: false, message: 'farm_land_id and crop_category are required' }, { status: 400 })
    }
    if (Number.isNaN(plantCount) || plantCount < 0) {
      return NextResponse.json({ result: false, message: 'plant_count must be non-negative' }, { status: 400 })
    }

    const farm = await resolveFarmByNumericId(tf, farmNumId)
    if (!farm) {
      return NextResponse.json({ result: false, message: 'Farm land not found' }, { status: 404 })
    }
    if (!(await farmerSelfAccess(ctx, farm.farmerId))) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }

    const plant = await db.farmPlant.create({
      data: {
        farmId: farm.id,
        cropCategory,
        // Optional Crop Master link (name match; null when the review
        // category has no CropMaster counterpart).
        cropMasterId: await resolveCropMasterId(cropCategory),
        variety: variety || null,
        plantCount,
        notes,
        createdBy: ctx.userId || null,
      },
    })

    return NextResponse.json({ result: true, data: { id: numericId(plant.id) } }, { status: 201 })
  } catch (error) {
    console.error('[ekibbo-farm-plants POST]', error)
    return NextResponse.json({ result: false, message: 'Failed to save plant' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const { searchParams } = new URL(req.url)
    const plantNumId = parseInt(searchParams.get('id') || '', 10)

    if (Number.isNaN(plantNumId)) {
      return NextResponse.json({ result: false, message: 'id is required' }, { status: 400 })
    }

    // Resolve plant by numeric id within tenant scope.
    const plants = await db.farmPlant.findMany({
      where: { farm: { farmer: { ...tf } } },
      select: { id: true, farm: { select: { farmerId: true } } },
      take: 5000,
    })
    const plant = plants.find(p => numericId(p.id) === plantNumId)
    if (!plant) {
      return NextResponse.json({ result: false, message: 'Plant record not found' }, { status: 404 })
    }
    if (!(await farmerSelfAccess(ctx, plant.farm.farmerId))) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }

    await db.farmPlant.delete({ where: { id: plant.id } })
    return NextResponse.json({ result: true })
  } catch (error) {
    console.error('[ekibbo-farm-plants DELETE]', error)
    return NextResponse.json({ result: false, message: 'Failed to delete plant' }, { status: 500 })
  }
}
