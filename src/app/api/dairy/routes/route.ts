import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/routes — list transport routes (paginated + search)
 * POST /api/dairy/routes — create a new transport route
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const mccId = searchParams.get('mccId')
    const processorId = searchParams.get('processorId')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (mccId) where.mccId = mccId
    if (processorId) where.processorId = processorId
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cutoffTime: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyTransportRoute.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { trips: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyTransportRoute.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyTransportRoute list error:', error)
    return NextResponse.json({ error: 'Failed to fetch transport routes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const created = await db.dairyTransportRoute.create({
      data: {
        tenantId: ctx.tenantId,
        name: body.name,
        mccId: body.mccId || null,
        processorId: body.processorId || null,
        distanceKm: body.distanceKm ? parseFloat(body.distanceKm) : null,
        cutoffTime: body.cutoffTime || null,
        stopsJson: body.stopsJson || null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyTransportRoute create error:', error)
    return NextResponse.json(
      { error: 'Failed to create transport route', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
