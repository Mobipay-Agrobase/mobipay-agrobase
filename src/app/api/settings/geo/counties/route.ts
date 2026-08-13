import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const districtId = searchParams.get('districtId')
    const rows = await db.county.findMany({ where: districtId ? { districtId } : {}, orderBy: { name: 'asc' } })
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('County list error:', error)
    return NextResponse.json({ error: 'Failed to fetch counties' }, { status: 500 })
  }
}

/**
 * POST /api/settings/geo/counties — Create a county
 * PUT /api/settings/geo/counties?id=xxx — Update
 * DELETE /api/settings/geo/counties?id=xxx — Delete
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.districtId || !body.name) {
      return NextResponse.json({ error: 'districtId and name are required' }, { status: 400 })
    }
    const county = await db.county.create({
      data: { name: body.name, districtId: body.districtId },
    })
    return NextResponse.json({ data: county }, { status: 201 })
  } catch (error) {
    console.error('County create error:', error)
    return NextResponse.json({ error: 'Failed to create county' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const body = await req.json()
    const county = await db.county.update({
      where: { id },
      data: { name: body.name },
    })
    return NextResponse.json({ data: county })
  } catch (error) {
    console.error('County update error:', error)
    return NextResponse.json({ error: 'Failed to update county' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const subCountyCount = await db.subCounty.count({ where: { countyId: id } })
    if (subCountyCount > 0) {
      return NextResponse.json({ error: 'Cannot delete county with sub-counties' }, { status: 400 })
    }
    await db.county.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('County delete error:', error)
    return NextResponse.json({ error: 'Failed to delete county' }, { status: 500 })
  }
}
