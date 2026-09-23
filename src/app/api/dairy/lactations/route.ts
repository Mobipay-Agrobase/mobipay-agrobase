import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/lactations — list lactation curves (paginated + search)
 * POST /api/dairy/lactations — create a new lactation record
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const cowId = searchParams.get('cowId')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (cowId) where.cowId = cowId
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { cow: { name: { contains: search, mode: 'insensitive' } } },
        { cow: { cowCode: { contains: search, mode: 'insensitive' } } },
        { cow: { tagNumber: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyLactation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { cow: { select: { id: true, name: true, cowCode: true, tagNumber: true } } },
        orderBy: { startDate: 'desc' },
      }),
      db.dairyLactation.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyLactation list error:', error)
    return NextResponse.json({ error: 'Failed to fetch lactations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.cowId) {
      return NextResponse.json({ error: 'cowId is required' }, { status: 400 })
    }
    if (body.lactationNumber === undefined || body.lactationNumber === null) {
      return NextResponse.json({ error: 'lactationNumber is required' }, { status: 400 })
    }
    if (!body.calvingDate) {
      return NextResponse.json({ error: 'calvingDate is required' }, { status: 400 })
    }

    const created = await db.dairyLactation.create({
      data: {
        tenantId: ctx.tenantId,
        cowId: body.cowId,
        lactationNumber: parseInt(body.lactationNumber),
        calvingDate: new Date(body.calvingDate),
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : null,
        peakYieldLitres: body.peakYieldLitres !== undefined ? (body.peakYieldLitres ? parseFloat(body.peakYieldLitres) : null) : null,
        peakDay: body.peakDay !== undefined ? (body.peakDay ? parseInt(body.peakDay) : null) : null,
        totalYieldLitres: body.totalYieldLitres !== undefined ? (body.totalYieldLitres ? parseFloat(body.totalYieldLitres) : null) : null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyLactation create error:', error)
    return NextResponse.json(
      { error: 'Failed to create lactation', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
