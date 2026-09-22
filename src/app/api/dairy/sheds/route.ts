import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/sheds — list dairy sheds (paginated + search)
 * POST /api/dairy/sheds — create a new shed
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { shadeNumber: { contains: search, mode: 'insensitive' } },
        { ventilationType: { contains: search, mode: 'insensitive' } },
        { beddingType: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyShade.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { cows: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyShade.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyShade list error:', error)
    return NextResponse.json({ error: 'Failed to fetch sheds' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.shadeNumber) {
      return NextResponse.json({ error: 'shadeNumber is required' }, { status: 400 })
    }

    const created = await db.dairyShade.create({
      data: {
        tenantId: ctx.tenantId,
        farmId: body.farmId || null,
        shadeNumber: body.shadeNumber,
        dimensionsSqm: body.dimensionsSqm ? parseFloat(body.dimensionsSqm) : null,
        ventilationType: body.ventilationType || null,
        beddingType: body.beddingType || null,
        capacity: body.capacity ? parseInt(body.capacity) : null,
        notes: body.notes || null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyShade create error:', error)
    return NextResponse.json(
      { error: 'Failed to create shed', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
