import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/temp-logs — list temperature logs (paginated + search)
 * POST /api/dairy/temp-logs — create a new temperature log
 *
 * Note: `DairyTempLog` is scoped to a trip rather than directly to a tenant,
 * so the tenant filter is applied via the parent trip's `tenantId`.
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const tripId = searchParams.get('tripId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Filter via the parent trip's tenantId so the tenant context is enforced.
    const where: Record<string, unknown> = {
      trip: { ...buildTenantFilter(ctx, 'tenantId') },
    }
    if (tripId) where.tripId = tripId
    if (startDate || endDate) {
      const range: Record<string, unknown> = {}
      if (startDate) range.gte = new Date(startDate)
      if (endDate) range.lte = new Date(endDate)
      where.loggedAt = range
    }
    if (search) {
      where.OR = [
        { trip: { sealNoOut: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyTempLog.findMany({
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
        orderBy: { loggedAt: 'desc' },
      }),
      db.dairyTempLog.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyTempLog list error:', error)
    return NextResponse.json({ error: 'Failed to fetch temperature logs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.tripId || body.tempC === undefined) {
      return NextResponse.json(
        { error: 'tripId and tempC are required' },
        { status: 400 },
      )
    }

    // Ensure the trip belongs to the current tenant before logging.
    const trip = await db.dairyTransportTrip.findFirst({
      where: { id: body.tripId, ...buildTenantFilter(ctx, 'tenantId') },
      select: { id: true },
    })
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found in tenant scope' }, { status: 404 })
    }

    const created = await db.dairyTempLog.create({
      data: {
        tripId: body.tripId,
        tempC: parseFloat(body.tempC),
        loggedAt: body.loggedAt ? new Date(body.loggedAt) : undefined,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyTempLog create error:', error)
    return NextResponse.json(
      { error: 'Failed to create temperature log', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
