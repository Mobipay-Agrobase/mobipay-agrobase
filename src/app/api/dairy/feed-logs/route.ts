import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/feed-logs — list feed logs (paginated + search)
 * POST /api/dairy/feed-logs — create a new feed log
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const feedType = searchParams.get('feedType')
    const cowId = searchParams.get('cowId')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (feedType) where.feedType = feedType
    if (cowId) where.cowId = cowId
    if (search) {
      where.OR = [
        { feedType: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyFeedLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { feedDate: 'desc' },
      }),
      db.dairyFeedLog.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyFeedLog list error:', error)
    return NextResponse.json({ error: 'Failed to fetch feed logs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (body.quantityKg === undefined) {
      return NextResponse.json({ error: 'quantityKg is required' }, { status: 400 })
    }

    const quantityKg = parseFloat(body.quantityKg)
    const costPerUnit = body.costPerUnit ? parseFloat(body.costPerUnit) : null
    const totalCost = body.totalCost
      ? parseFloat(body.totalCost)
      : costPerUnit !== null
        ? quantityKg * costPerUnit
        : null

    const created = await db.dairyFeedLog.create({
      data: {
        tenantId: ctx.tenantId,
        feedDate: body.feedDate ? new Date(body.feedDate) : new Date(),
        feedType: body.feedType || 'Forage',
        quantityKg,
        costPerUnit,
        totalCost,
        feedConversionRatio: body.feedConversionRatio ? parseFloat(body.feedConversionRatio) : null,
        cowId: body.cowId || null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyFeedLog create error:', error)
    return NextResponse.json(
      { error: 'Failed to create feed log', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
