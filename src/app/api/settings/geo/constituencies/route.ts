import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/settings/geo/constituencies — Create a constituency
 * PUT /api/settings/geo/constituencies?id=xxx — Update
 * DELETE /api/settings/geo/constituencies?id=xxx — Delete
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.districtId || !body.name) {
      return NextResponse.json({ error: 'districtId and name are required' }, { status: 400 })
    }
    const constituency = await db.constituency.create({
      data: { name: body.name, districtId: body.districtId },
    })
    return NextResponse.json({ data: constituency }, { status: 201 })
  } catch (error) {
    console.error('Constituency create error:', error)
    return NextResponse.json({ error: 'Failed to create constituency' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const body = await req.json()
    const constituency = await db.constituency.update({
      where: { id },
      data: { name: body.name },
    })
    return NextResponse.json({ data: constituency })
  } catch (error) {
    console.error('Constituency update error:', error)
    return NextResponse.json({ error: 'Failed to update constituency' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const subCountyCount = await db.subCounty.count({ where: { constituencyId: id } })
    if (subCountyCount > 0) {
      return NextResponse.json({ error: 'Cannot delete constituency with sub-counties' }, { status: 400 })
    }
    await db.constituency.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Constituency delete error:', error)
    return NextResponse.json({ error: 'Failed to delete constituency' }, { status: 500 })
  }
}
