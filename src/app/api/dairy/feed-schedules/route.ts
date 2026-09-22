import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/feed-schedules — list feed schedules (paginated + search)
 * POST /api/dairy/feed-schedules — create a new feed schedule
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const cowId = searchParams.get('cowId')
    const feedItemId = searchParams.get('feedItemId')
    const staffId = searchParams.get('staffId')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (cowId) where.cowId = cowId
    if (feedItemId) where.feedItemId = feedItemId
    if (staffId) where.staffId = staffId
    if (search) {
      where.OR = [
        { feedTime: { contains: search, mode: 'insensitive' } },
        { cow: { name: { contains: search, mode: 'insensitive' } } },
        { feedItem: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyFeedSchedule.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          cow: { select: { id: true, name: true, cowCode: true } },
          feedItem: { select: { id: true, name: true } },
          staff: { select: { id: true, name: true } },
        },
        orderBy: { feedDate: 'desc' },
      }),
      db.dairyFeedSchedule.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyFeedSchedule list error:', error)
    return NextResponse.json({ error: 'Failed to fetch feed schedules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.cowId || !body.feedItemId) {
      return NextResponse.json({ error: 'cowId and feedItemId are required' }, { status: 400 })
    }

    const created = await db.dairyFeedSchedule.create({
      data: {
        tenantId: ctx.tenantId,
        cowId: body.cowId,
        feedItemId: body.feedItemId,
        feedTime: body.feedTime || '00:00',
        durationMinutes: body.durationMinutes ? parseInt(body.durationMinutes) : null,
        feedAmountKg: body.feedAmountKg ? parseFloat(body.feedAmountKg) : 0,
        staffId: body.staffId || null,
        feedDate: body.feedDate ? new Date(body.feedDate) : new Date(),
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyFeedSchedule create error:', error)
    return NextResponse.json(
      { error: 'Failed to create feed schedule', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
