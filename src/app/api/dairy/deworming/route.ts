import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/deworming — list deworming records (paginated + search)
 * POST /api/dairy/deworming — create a new deworming record
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const cowId = searchParams.get('cowId')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (cowId) where.cowId = cowId
    if (search) {
      where.OR = [
        { productUsed: { contains: search, mode: 'insensitive' } },
        { administeredBy: { contains: search, mode: 'insensitive' } },
        { dose: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { cow: { OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { cowCode: { contains: search, mode: 'insensitive' } },
          { tagNumber: { contains: search, mode: 'insensitive' } },
        ] } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyDewormingRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { cow: { select: { id: true, name: true, cowCode: true, tagNumber: true } } },
        orderBy: { dewormingDate: 'desc' },
      }),
      db.dairyDewormingRecord.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyDewormingRecord list error:', error)
    return NextResponse.json({ error: 'Failed to fetch deworming records' }, { status: 500 })
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
    if (!body.dewormingDate) {
      return NextResponse.json({ error: 'dewormingDate is required' }, { status: 400 })
    }
    if (!body.productUsed) {
      return NextResponse.json({ error: 'productUsed is required' }, { status: 400 })
    }

    const created = await db.dairyDewormingRecord.create({
      data: {
        tenantId: ctx.tenantId,
        cowId: body.cowId,
        dewormingDate: new Date(body.dewormingDate),
        productUsed: body.productUsed,
        dose: body.dose || '',
        administrationRoute: body.administrationRoute || 'Oral',
        nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
        administeredBy: body.administeredBy || null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyDewormingRecord create error:', error)
    return NextResponse.json(
      { error: 'Failed to create deworming record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
