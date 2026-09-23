import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/offtakers — list offtakers / MCC / processor buyers (paginated + search)
 * POST /api/dairy/offtakers — create a new offtaker
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offtakerType = searchParams.get('offtakerType')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (offtakerType) where.offtakerType = offtakerType
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { contactPhone: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyOfftaker.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { mccCenters: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyOfftaker.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyOfftaker list error:', error)
    return NextResponse.json({ error: 'Failed to fetch offtakers' }, { status: 500 })
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

    const created = await db.dairyOfftaker.create({
      data: {
        tenantId: ctx.tenantId,
        name: body.name,
        offtakerType: body.offtakerType || 'mcc',
        contactPhone: body.contactPhone || null,
        contactEmail: body.contactEmail || null,
        location: body.location || null,
        paymentTerms: body.paymentTerms || 'weekly',
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyOfftaker create error:', error)
    return NextResponse.json(
      { error: 'Failed to create offtaker', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
