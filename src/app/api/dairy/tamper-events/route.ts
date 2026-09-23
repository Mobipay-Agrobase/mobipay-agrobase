import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/tamper-events — list tamper events (paginated + search)
 * POST /api/dairy/tamper-events — create a new tamper event
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const tripId = searchParams.get('tripId')
    const eventType = searchParams.get('eventType')
    const resolved = searchParams.get('resolved')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (tripId) where.tripId = tripId
    if (eventType) where.eventType = eventType
    if (resolved === 'true') where.resolved = true
    if (resolved === 'false') where.resolved = false
    if (search) {
      where.OR = [
        { eventType: { contains: search, mode: 'insensitive' } },
        { detailsJson: { contains: search, mode: 'insensitive' } },
        { resolvedBy: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyTamperEvent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          trip: {
            select: {
              id: true,
              tripDate: true,
              status: true,
              transporter: { select: { id: true, fullName: true } },
              vehicle: { select: { id: true, plateNo: true } },
            },
          },
        },
        orderBy: { detectedAt: 'desc' },
      }),
      db.dairyTamperEvent.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyTamperEvent list error:', error)
    return NextResponse.json({ error: 'Failed to fetch tamper events' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.tripId || !body.eventType) {
      return NextResponse.json(
        { error: 'tripId and eventType are required' },
        { status: 400 },
      )
    }

    const created = await db.dairyTamperEvent.create({
      data: {
        tenantId: ctx.tenantId,
        tripId: body.tripId,
        eventType: body.eventType,
        detectedAt: body.detectedAt ? new Date(body.detectedAt) : undefined,
        detailsJson: body.detailsJson || null,
        resolved: body.resolved !== undefined ? !!body.resolved : false,
        resolvedAt: body.resolvedAt ? new Date(body.resolvedAt) : null,
        resolvedBy: body.resolvedBy || null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyTamperEvent create error:', error)
    return NextResponse.json(
      { error: 'Failed to create tamper event', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
