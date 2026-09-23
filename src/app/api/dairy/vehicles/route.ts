import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/vehicles — list vehicles (paginated + search)
 * POST /api/dairy/vehicles — create a new vehicle
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const transporterId = searchParams.get('transporterId')
    const vehicleType = searchParams.get('vehicleType')
    const coldChain = searchParams.get('coldChain')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (transporterId) where.transporterId = transporterId
    if (vehicleType) where.vehicleType = vehicleType
    if (coldChain === 'true') where.coldChain = true
    if (coldChain === 'false') where.coldChain = false
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { plateNo: { contains: search, mode: 'insensitive' } },
        { tempLoggerUid: { contains: search, mode: 'insensitive' } },
        { gpsUid: { contains: search, mode: 'insensitive' } },
        { transporter: { fullName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyVehicle.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          transporter: { select: { id: true, fullName: true, transporterCode: true } },
          _count: { select: { trips: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyVehicle.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyVehicle list error:', error)
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.transporterId || !body.plateNo || body.capacityLitres === undefined) {
      return NextResponse.json(
        { error: 'transporterId, plateNo and capacityLitres are required' },
        { status: 400 },
      )
    }

    const created = await db.dairyVehicle.create({
      data: {
        tenantId: ctx.tenantId,
        transporterId: body.transporterId,
        plateNo: body.plateNo,
        vehicleType: body.vehicleType || 'pickup',
        capacityLitres: parseInt(body.capacityLitres),
        coldChain: body.coldChain !== undefined ? !!body.coldChain : false,
        tempLoggerUid: body.tempLoggerUid || null,
        gpsUid: body.gpsUid || null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyVehicle create error:', error)
    return NextResponse.json(
      { error: 'Failed to create vehicle', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
