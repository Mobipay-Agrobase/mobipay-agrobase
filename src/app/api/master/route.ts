import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'

/**
 * Generic Master Data API.
 *
 * GET  /api/master?type=crop|season|seed|fertilizer|equipment|pesticide|weed|disease|pest|soilype&search=&page=&limit=
 * POST /api/master?type=crop            — create      (JSON body of model fields)
 * PUT  /api/master?type=crop&id=xxx      — update copy
 * DELETE /api/master?type=crop&id=xxx    — delete
 */

const DELEGATES: Record<string, any> = {
  crop: db.cropMaster,
  season: db.seasonMaster,
  seed: db.seedMaster,
  fertilizer: db.fertilizerMaster,
  equipment: db.equipmentMaster,
  pesticide: db.pesticideMaster,
  weed: db.weedMaster,
  disease: db.diseaseMaster,
  pest: db.pestMaster,
  soiltype: db.soilTypeMaster,
}

// A simple, generic "active" filter: every master model has a status or can be
// listed raw. We simply return all rows ordered by name.
const ORDER: Record<string, { by: any; dir: 'asc' | 'desc' }> = {
  crop: { by: 'name', dir: 'asc' },
  season: { by: 'fromDate', dir: 'desc' },
}

export async function GET(request: Request) {
  try {
    await getTenantContext()
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') || 'crop').toLowerCase()

    const delegate = DELEGATES[type]
    if (!delegate) {
      return NextResponse.json({ error: `Unknown master type: ${type}` }, { status: 400 })
    }

    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [rows, total] = await Promise.all([
      delegate.findMany({
        where,
        orderBy: ORDER[type]?.by ? { [ORDER[type].by]: ORDER[type].dir } : { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      delegate.count({ where }),
    ])

    return NextResponse.json({ data: rows, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error(`Master [${(new URL(request.url)).searchParams.get('type') || 'crop'}] list error:`, error)
    return NextResponse.json({ error: 'Failed to fetch master data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await getTenantContext()
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') || 'crop').toLowerCase()
    const delegate = DELEGATES[type]
    if (!delegate) return NextResponse.json({ error: `Unknown master type: ${type}` }, { status: 400 })

    const body = await request.json()
    // strip id/createdAt/updatedAt so create uses defaults
    const { id, createdAt, updatedAt, ...data } = body

    const row = await delegate.create({ data })
    return NextResponse.json({ data: row }, { status: 201 })
  } catch (error: any) {
    console.error('Master create error:', error)
    const msg = error?.code === 'P2002'
      ? 'A record with that name already exists'
      : 'Failed to create master record'
    return NextResponse.json({ error: msg, detail: error?.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await getTenantContext()
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') || 'crop').toLowerCase()
    const id = searchParams.get('id')
    const delegate = DELEGATES[type]
    if (!delegate) return NextResponse.json({ error: `Unknown master type: ${type}` }, { status: 400 })
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const body = await request.json()
    const { id: _b, createdAt, updatedAt, ...data } = body

    const row = await delegate.update({ where: { id }, data })
    return NextResponse.json({ data: row })
  } catch (error: any) {
    console.error('Master update error:', error)
    return NextResponse.json({ error: 'Failed to update master record', detail: error?.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await getTenantContext()
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') || 'crop').toLowerCase()
    const id = searchParams.get('id')
    const delegate = DELEGATES[type]
    if (!delegate) return NextResponse.json({ error: `Unknown master type: ${type}` }, { status: 400 })
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await delegate.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Master delete error:', error)
    return NextResponse.json({ error: 'Failed to delete master record', detail: error?.message }, { status: 500 })
  }
}