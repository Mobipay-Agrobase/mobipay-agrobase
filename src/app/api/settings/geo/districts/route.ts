import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subRegionId = searchParams.get('subRegionId')
    const rows = await db.district.findMany({ where: subRegionId ? { subRegionId } : {}, orderBy: { name: 'asc' } })
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('District list error:', error)
    return NextResponse.json({ error: 'Failed to fetch districts' }, { status: 500 })
  }
}

/**
 * POST /api/settings/geo/districts — Create a district
 * PUT /api/settings/geo/districts?id=xxx — Update a district
 * DELETE /api/settings/geo/districts?id=xxx — Delete a district
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.subRegionId || !body.name) {
      return NextResponse.json({ error: 'subRegionId and name are required' }, { status: 400 })
    }
    const district = await db.district.create({
      data: { name: body.name, subRegionId: body.subRegionId },
    })
    return NextResponse.json({ data: district }, { status: 201 })
  } catch (error) {
    console.error('District create error:', error)
    return NextResponse.json({ error: 'Failed to create district' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const body = await req.json()
    const district = await db.district.update({
      where: { id },
      data: { name: body.name },
    })
    return NextResponse.json({ data: district })
  } catch (error) {
    console.error('District update error:', error)
    return NextResponse.json({ error: 'Failed to update district' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const countyCount = await db.county.count({ where: { districtId: id } })
    if (countyCount > 0) {
      return NextResponse.json({ error: 'Cannot delete district with counties' }, { status: 400 })
    }
    await db.district.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('District delete error:', error)
    return NextResponse.json({ error: 'Failed to delete district' }, { status: 500 })
  }
}
