import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/iot-devices — list IoT devices (paginated + search)
 * POST /api/dairy/iot-devices — create a new IoT device
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const deviceType = searchParams.get('deviceType')
    const cowId = searchParams.get('cowId')
    const vehicleId = searchParams.get('vehicleId')
    const mccCenterId = searchParams.get('mccCenterId')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (deviceType) where.deviceType = deviceType
    if (cowId) where.cowId = cowId
    if (vehicleId) where.vehicleId = vehicleId
    if (mccCenterId) where.mccCenterId = mccCenterId
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { deviceUid: { contains: search, mode: 'insensitive' } },
        { deviceType: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { firmwareVersion: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyIoTDevice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          pings: {
            take: 5,
            orderBy: { pingedAt: 'desc' },
          },
          _count: { select: { pings: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyIoTDevice.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyIoTDevice list error:', error)
    return NextResponse.json({ error: 'Failed to fetch IoT devices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const created = await db.dairyIoTDevice.create({
      data: {
        tenantId: ctx.tenantId,
        deviceUid: body.deviceUid,
        deviceType: body.deviceType || 'gps_collar',
        manufacturer: body.manufacturer || null,
        model: body.model || null,
        firmwareVersion: body.firmwareVersion || null,
        cowId: body.cowId || null,
        vehicleId: body.vehicleId || null,
        mccCenterId: body.mccCenterId || null,
        batteryPct: body.batteryPct !== undefined && body.batteryPct !== null ? parseFloat(body.batteryPct) : null,
        lastPingAt: body.lastPingAt ? new Date(body.lastPingAt) : null,
        lastPingLat: body.lastPingLat !== undefined && body.lastPingLat !== null ? parseFloat(body.lastPingLat) : null,
        lastPingLng: body.lastPingLng !== undefined && body.lastPingLng !== null ? parseFloat(body.lastPingLng) : null,
        config: body.config || null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyIoTDevice create error:', error)
    return NextResponse.json(
      { error: 'Failed to create IoT device', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
