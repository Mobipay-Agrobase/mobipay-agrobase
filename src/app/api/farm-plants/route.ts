import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { resolveCropMasterId } from '@/lib/farm-plant-crop-link'

/**
 * GET /api/farm-plants?farmId=xxx
 *   List the plant inventory rows for ONE farm (per-farm breakdown used by
 *   the Farm Land Registry "Plants" tab). Tenant-scoped via farm → farmer.
 *   Each row carries cropMasterName when it is linked to Crop Master.
 *
 * POST /api/farm-plants
 *   Add a plant row to a farm. Body (JSON or multipart):
 *     { farmId, cropCategory, variety?, plantCount, notes?, createdBy? }
 *   The server resolves the optional CropMaster link (name match) and
 *   stores cropMasterId alongside cropCategory.
 *
 * Second review (H): this is the data-entry surface for the "Total Plants"
 * registry KPI — the breakdown per crop type (Coffee–Robusta, Cocoa–
 * Trinitario/Forastero/Criollo, Vanilla, Shade Trees, Bananas, Jackfruit,
 * Avocado, Cassava) is aggregated from these rows.
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get('farmId')

    if (!farmId) {
      return NextResponse.json({ error: 'farmId is required' }, { status: 400 })
    }

    // Tenant scoping: the farm must belong to a farmer in tenant scope.
    const farm = await db.farmLand.findFirst({
      where: { id: farmId, farmer: { ...buildTenantFilter(ctx, 'tenantId') } },
      select: { id: true, name: true, farmerId: true },
    })
    if (!farm) {
      return NextResponse.json({ error: 'Farm not found or access denied' }, { status: 404 })
    }

    const plants = await db.farmPlant.findMany({
      where: { farmId },
      orderBy: [{ cropCategory: 'asc' }, { createdAt: 'desc' }],
      include: { cropMaster: { select: { name: true } } },
    })

    return NextResponse.json({
      plants: plants.map(p => ({
        ...p,
        cropMasterName: p.cropMaster?.name ?? null,
        cropMaster: undefined,
      })),
    })
  } catch (error) {
    console.error('Farm plants list error:', error)
    return NextResponse.json({ error: 'Failed to fetch farm plants' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()

    // Web form sends JSON; mobile/legacy clients may send multipart.
    const body: Record<string, any> = {}
    const ct = request.headers.get('content-type') || ''
    if (ct.includes('multipart/form-data')) {
      const form = await request.formData()
      for (const [k, v] of form.entries()) {
        if (typeof v === 'string') body[k] = v
      }
    } else {
      Object.assign(body, await request.json().catch(() => ({})))
    }

    const farmId = body.farmId || body.farm_id
    const cropCategory = (body.cropCategory || body.crop_category || '').trim()
    const variety = body.variety != null ? String(body.variety).trim() : null
    const plantCount = parseInt(String(body.plantCount ?? body.plant_count ?? '0'), 10)
    const notes = body.notes != null && String(body.notes).trim() !== '' ? String(body.notes).trim() : null

    if (!farmId || !cropCategory) {
      return NextResponse.json({ error: 'farmId and cropCategory are required' }, { status: 400 })
    }
    if (Number.isNaN(plantCount) || plantCount < 0) {
      return NextResponse.json({ error: 'plantCount must be a non-negative number' }, { status: 400 })
    }

    // Tenant scoping: the farm must belong to a farmer in tenant scope.
    const farm = await db.farmLand.findFirst({
      where: { id: farmId, farmer: { ...buildTenantFilter(ctx, 'tenantId') } },
      select: { id: true, farmerId: true },
    })
    if (!farm) {
      return NextResponse.json({ error: 'Farm not found or access denied' }, { status: 404 })
    }

    const plant = await db.farmPlant.create({
      data: {
        farmId,
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

    return NextResponse.json({ plant }, { status: 201 })
  } catch (error) {
    console.error('Farm plant create error:', error)
    return NextResponse.json({ error: 'Failed to create farm plant' }, { status: 500 })
  }
}
