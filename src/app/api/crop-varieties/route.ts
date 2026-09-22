import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/crop-varieties?cropId=xxx
 *   List all crop varieties, optionally filtered by cropId.
 *
 * POST /api/crop-varieties
 *   Create a new variety. Body: { cropId, name, cropCycleDays?, initialHarvestDays? }
 *
 * PUT /api/crop-varieties?id=xxx
 *   Update a variety.
 *
 * DELETE /api/crop-varieties?id=xxx
 *   Delete a variety.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cropId = searchParams.get('cropId')

    const where: Record<string, unknown> = {}
    if (cropId) where.cropId = cropId

    const varieties = await db.cropVariety.findMany({
      where,
      include: { crop: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: varieties })
  } catch (error) {
    console.error('Crop varieties list error:', error)
    return NextResponse.json({ error: 'Failed to fetch crop varieties' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cropId, name, cropCycleDays, initialHarvestDays } = body

    if (!cropId || !name) {
      return NextResponse.json({ error: 'cropId and name are required' }, { status: 400 })
    }

    // Verify the crop exists
    const crop = await db.cropMaster.findUnique({ where: { id: cropId } })
    if (!crop) {
      return NextResponse.json({ error: 'Crop not found' }, { status: 404 })
    }

    const variety = await db.cropVariety.create({
      data: {
        cropId,
        name: String(name).trim(),
        cropCycleDays: cropCycleDays ? parseInt(cropCycleDays) : null,
        initialHarvestDays: initialHarvestDays ? parseInt(initialHarvestDays) : null,
      },
      include: { crop: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ data: variety }, { status: 201 })
  } catch (error: any) {
    console.error('Crop variety create error:', error)
    const msg = error?.code === 'P2002' ? 'A variety with that name already exists for this crop' : 'Failed to create variety'
    return NextResponse.json({ error: msg, detail: error?.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const body = await request.json()
    const { name, cropCycleDays, initialHarvestDays } = body

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = String(name).trim()
    if (cropCycleDays !== undefined) data.cropCycleDays = cropCycleDays ? parseInt(cropCycleDays) : null
    if (initialHarvestDays !== undefined) data.initialHarvestDays = initialHarvestDays ? parseInt(initialHarvestDays) : null

    const updated = await db.cropVariety.update({
      where: { id },
      data,
      include: { crop: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    console.error('Crop variety update error:', error)
    return NextResponse.json({ error: 'Failed to update variety', detail: error?.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await db.cropVariety.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Crop variety delete error:', error)
    return NextResponse.json({ error: 'Failed to delete variety', detail: error?.message }, { status: 500 })
  }
}
