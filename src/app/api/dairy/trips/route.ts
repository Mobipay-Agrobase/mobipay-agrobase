import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/trips — list transport trips (paginated + search)
 * POST /api/dairy/trips — create a new transport trip
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const transporterId = searchParams.get('transporterId')
    const vehicleId = searchParams.get('vehicleId')
    const routeId = searchParams.get('routeId')
    const status = searchParams.get('status')
    const tripType = searchParams.get('tripType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (transporterId) where.transporterId = transporterId
    if (vehicleId) where.vehicleId = vehicleId
    if (routeId) where.routeId = routeId
    if (status) where.status = status
    if (tripType) where.tripType = tripType
    if (startDate || endDate) {
      const range: Record<string, unknown> = {}
      if (startDate) range.gte = new Date(startDate)
      if (endDate) range.lte = new Date(endDate)
      where.tripDate = range
    }
    if (search) {
      where.OR = [
        { sealNoOut: { contains: search, mode: 'insensitive' } },
        { sealNoIn: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { transporter: { fullName: { contains: search, mode: 'insensitive' } } },
        { vehicle: { plateNo: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyTransportTrip.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          route: { select: { id: true, name: true } },
          transporter: { select: { id: true, fullName: true, transporterCode: true } },
          vehicle: { select: { id: true, plateNo: true, vehicleType: true } },
          _count: { select: { pickups: true, tempLogs: true, tamperEvents: true } },
        },
        orderBy: { tripDate: 'desc' },
      }),
      db.dairyTransportTrip.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyTransportTrip list error:', error)
    return NextResponse.json({ error: 'Failed to fetch transport trips' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.transporterId || !body.vehicleId || !body.tripDate) {
      return NextResponse.json(
        { error: 'transporterId, vehicleId and tripDate are required' },
        { status: 400 },
      )
    }

    const created = await db.dairyTransportTrip.create({
      data: {
        tenantId: ctx.tenantId,
        routeId: body.routeId || null,
        transporterId: body.transporterId,
        vehicleId: body.vehicleId,
        tripDate: new Date(body.tripDate),
        tripType: body.tripType || 'farm_to_mcc',
        status: body.status || 'planned',
        startedAt: body.startedAt ? new Date(body.startedAt) : null,
        endedAt: body.endedAt ? new Date(body.endedAt) : null,
        distanceKm: body.distanceKm ? parseFloat(body.distanceKm) : null,
        litresPicked: body.litresPicked ? parseFloat(body.litresPicked) : null,
        litresDelivered: body.litresDelivered ? parseFloat(body.litresDelivered) : null,
        costTotal: body.costTotal ? parseFloat(body.costTotal) : null,
        costPerLitre: body.costPerLitre ? parseFloat(body.costPerLitre) : null,
        sealNoOut: body.sealNoOut || null,
        sealNoIn: body.sealNoIn || null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyTransportTrip create error:', error)
    return NextResponse.json(
      { error: 'Failed to create transport trip', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
