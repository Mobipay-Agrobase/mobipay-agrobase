import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const regionId = searchParams.get('regionId')
    const rows = await db.subRegion.findMany({ where: regionId ? { regionId } : {}, orderBy: { name: 'asc' } })
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Sub-region list error:', error)
    return NextResponse.json({ error: 'Failed to fetch sub-regions' }, { status: 500 })
  }
}

/**
 * POST /api/settings/geo/sub-regions — Create a sub-region
 * DELETE /api/settings/geo/sub-regions?id=xxx — Delete a sub-region
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.regionId || !body.name) {
      return NextResponse.json({ error: 'regionId and name are required' }, { status: 400 })
    }
    const subRegion = await db.subRegion.create({
      data: { name: body.name, regionId: body.regionId },
    })
    return NextResponse.json({ data: subRegion }, { status: 201 })
  } catch (error) {
    console.error('SubRegion create error:', error)
    return NextResponse.json({ error: 'Failed to create sub-region' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const body = await req.json()
    const subRegion = await db.subRegion.update({
      where: { id },
      data: { name: body.name },
    })
    return NextResponse.json({ data: subRegion })
  } catch (error) {
    console.error('SubRegion update error:', error)
    return NextResponse.json({ error: 'Failed to update sub-region' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const districtCount = await db.district.count({ where: { subRegionId: id } })
    if (districtCount > 0) {
      return NextResponse.json({ error: 'Cannot delete sub-region with districts' }, { status: 400 })
    }
    await db.subRegion.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('SubRegion delete error:', error)
    return NextResponse.json({ error: 'Failed to delete sub-region' }, { status: 500 })
  }
}
