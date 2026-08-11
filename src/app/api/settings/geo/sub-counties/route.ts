import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/settings/geo/sub-counties — Create a sub-county
 * PUT /api/settings/geo/sub-counties?id=xxx — Update
 * DELETE /api/settings/geo/sub-counties?id=xxx — Delete
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.constituencyId || !body.name) {
      return NextResponse.json({ error: 'constituencyId and name are required' }, { status: 400 })
    }
    const subCounty = await db.subCounty.create({
      data: { name: body.name, constituencyId: body.constituencyId },
    })
    return NextResponse.json({ data: subCounty }, { status: 201 })
  } catch (error) {
    console.error('SubCounty create error:', error)
    return NextResponse.json({ error: 'Failed to create sub-county' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const body = await req.json()
    const subCounty = await db.subCounty.update({
      where: { id },
      data: { name: body.name },
    })
    return NextResponse.json({ data: subCounty })
  } catch (error) {
    console.error('SubCounty update error:', error)
    return NextResponse.json({ error: 'Failed to update sub-county' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const parishCount = await db.parish.count({ where: { subCountyId: id } })
    if (parishCount > 0) {
      return NextResponse.json({ error: 'Cannot delete sub-county with parishes' }, { status: 400 })
    }
    await db.subCounty.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('SubCounty delete error:', error)
    return NextResponse.json({ error: 'Failed to delete sub-county' }, { status: 500 })
  }
}
