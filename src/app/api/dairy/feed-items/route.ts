import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/feed-items — list feed items (paginated + search)
 * POST /api/dairy/feed-items — create a new feed item
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const feedType = searchParams.get('feedType')
    const supplierId = searchParams.get('supplierId')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (feedType) where.feedType = feedType
    if (supplierId) where.supplierId = supplierId
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { feedType: { contains: search, mode: 'insensitive' } },
        { nutritionalValue: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyFeedItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          supplier: { select: { id: true, name: true } },
          _count: { select: { feedSchedules: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyFeedItem.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyFeedItem list error:', error)
    return NextResponse.json({ error: 'Failed to fetch feed items' }, { status: 500 })
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

    const created = await db.dairyFeedItem.create({
      data: {
        tenantId: ctx.tenantId,
        name: body.name,
        feedType: body.feedType || null,
        quantityInStock: body.quantityInStock ? parseFloat(body.quantityInStock) : 0,
        unitPrice: body.unitPrice ? parseFloat(body.unitPrice) : 0,
        nutritionalValue: body.nutritionalValue || null,
        supplierId: body.supplierId || null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyFeedItem create error:', error)
    return NextResponse.json(
      { error: 'Failed to create feed item', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
