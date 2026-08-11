import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/settings/geo/villages — Create a village
 * PUT /api/settings/geo/villages?id=xxx — Update
 * DELETE /api/settings/geo/villages?id=xxx — Delete
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.parishId || !body.name) {
      return NextResponse.json({ error: 'parishId and name are required' }, { status: 400 })
    }
    const village = await db.village.create({
      data: { name: body.name, parishId: body.parishId },
    })
    return NextResponse.json({ data: village }, { status: 201 })
  } catch (error) {
    console.error('Village create error:', error)
    return NextResponse.json({ error: 'Failed to create village' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const body = await req.json()
    const village = await db.village.update({
      where: { id },
      data: { name: body.name },
    })
    return NextResponse.json({ data: village })
  } catch (error) {
    console.error('Village update error:', error)
    return NextResponse.json({ error: 'Failed to update village' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const farmerCount = await db.farmerProfile.count({ where: { villageId: id } })
    if (farmerCount > 0) {
      return NextResponse.json({ error: 'Cannot delete village with farmers' }, { status: 400 })
    }
    await db.village.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Village delete error:', error)
    return NextResponse.json({ error: 'Failed to delete village' }, { status: 500 })
  }
}
