import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { resolveCropMasterId } from '@/lib/farm-plant-crop-link'

/**
 * PUT /api/farm-plants/[id]
 *   Edit one plant inventory row (cropCategory / variety / plantCount / notes).
 *   When the crop category changes, the optional CropMaster link is
 *   re-resolved by name match.
 *
 * DELETE /api/farm-plants/[id]
 *   Remove one plant inventory row.
 *
 * Tenant-scoped via plant → farm → farmer. Second review (H).
 */
async function resolvePlant(id: string, tf: Record<string, unknown>) {
  return db.farmPlant.findFirst({
    where: { id, farm: { farmer: { ...tf } } },
    include: { farm: { select: { id: true, farmerId: true } } },
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getTenantContext()
    const { id } = await params
    const plant = await resolvePlant(id, buildTenantFilter(ctx, 'tenantId'))
    if (!plant) {
      return NextResponse.json({ error: 'Plant record not found or access denied' }, { status: 404 })
    }

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

    const cropCategory = body.cropCategory != null ? String(body.cropCategory).trim() : undefined
    const variety = body.variety !== undefined ? (String(body.variety).trim() || null) : undefined
    const plantCount =
      body.plantCount !== undefined ? parseInt(String(body.plantCount), 10) : undefined
    const notes = body.notes !== undefined ? (String(body.notes).trim() || null) : undefined

    if (plantCount !== undefined && (Number.isNaN(plantCount) || plantCount < 0)) {
      return NextResponse.json({ error: 'plantCount must be a non-negative number' }, { status: 400 })
    }
    if (cropCategory !== undefined && cropCategory === '') {
      return NextResponse.json({ error: 'cropCategory cannot be empty' }, { status: 400 })
    }

    const updated = await db.farmPlant.update({
      where: { id: plant.id },
      data: {
        // Re-resolve the Crop Master link whenever category or variety
        // changes (variety first — carries the species for shade trees).
        ...((cropCategory !== undefined || variety !== undefined)
          ? { cropMasterId: await resolveCropMasterId(
              cropCategory ?? plant.cropCategory,
              variety ?? plant.variety) }
          : {}),
        ...(cropCategory !== undefined ? { cropCategory } : {}),
        ...(variety !== undefined ? { variety } : {}),
        ...(plantCount !== undefined ? { plantCount } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    })

    return NextResponse.json({ plant: updated })
  } catch (error) {
    console.error('Farm plant update error:', error)
    return NextResponse.json({ error: 'Failed to update farm plant' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getTenantContext()
    const { id } = await params
    const plant = await resolvePlant(id, buildTenantFilter(ctx, 'tenantId'))
    if (!plant) {
      return NextResponse.json({ error: 'Plant record not found or access denied' }, { status: 404 })
    }

    await db.farmPlant.delete({ where: { id: plant.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Farm plant delete error:', error)
    return NextResponse.json({ error: 'Failed to delete farm plant' }, { status: 500 })
  }
}
