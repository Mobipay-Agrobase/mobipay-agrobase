import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subCountyId = searchParams.get('subCountyId')
    const rows = await db.parish.findMany({ where: subCountyId ? { subCountyId } : {}, orderBy: { name: 'asc' } })
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Parish list error:', error)
    return NextResponse.json({ error: 'Failed to fetch parishes' }, { status: 500 })
  }
}

/**
 * POST /api/settings/geo/parishes — Create a parish
 * PUT /api/settings/geo/parishes?id=xxx — Update
 * DELETE /api/settings/geo/parishes?id=xxx — Delete
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.subCountyId || !body.name) {
      return NextResponse.json({ error: 'subCountyId and name are required' }, { status: 400 })
    }
    const parish = await db.parish.create({
      data: { name: body.name, subCountyId: body.subCountyId },
    })
    return NextResponse.json({ data: parish }, { status: 201 })
  } catch (error) {
    console.error('Parish create error:', error)
    return NextResponse.json({ error: 'Failed to create parish' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const body = await req.json()
    const parish = await db.parish.update({
      where: { id },
      data: { name: body.name },
    })
    return NextResponse.json({ data: parish })
  } catch (error) {
    console.error('Parish update error:', error)
    return NextResponse.json({ error: 'Failed to update parish' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const villageCount = await db.village.count({ where: { parishId: id } })
    if (villageCount > 0) {
      return NextResponse.json({ error: 'Cannot delete parish with villages' }, { status: 400 })
    }
    await db.parish.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Parish delete error:', error)
    return NextResponse.json({ error: 'Failed to delete parish' }, { status: 500 })
  }
}
