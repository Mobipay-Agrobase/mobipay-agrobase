import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/iot-pings — list IoT pings (paginated + search, filter by deviceId)
 * POST /api/dairy/iot-pings — create a new IoT ping
 *
 * NOTE: DairyIoTPing has no tenantId column of its own — it's scoped via the
 * parent DairyIoTDevice.tenantId. We use `buildTenantFilter(ctx, 'tenantId')`
 * and apply it to the nested `device` relation filter (works for SUPER_ADMIN
 * too, where the filter is an empty object = match all devices).
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const deviceId = searchParams.get('deviceId')
    const pingType = searchParams.get('pingType')

    const where: Record<string, unknown> = {
      device: buildTenantFilter(ctx, 'tenantId'),
    }
    if (deviceId) where.deviceId = deviceId
    if (pingType) where.pingType = pingType
    if (search) {
      where.OR = [
        { pingType: { contains: search, mode: 'insensitive' } },
        { deviceId: { contains: search, mode: 'insensitive' } },
        { data: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyIoTPing.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          device: { select: { id: true, deviceUid: true, deviceType: true, tenantId: true } },
        },
        orderBy: { pingedAt: 'desc' },
      }),
      db.dairyIoTPing.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyIoTPing list error:', error)
    return NextResponse.json({ error: 'Failed to fetch IoT pings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the referenced device belongs to the current tenant.
    const device = await db.dairyIoTDevice.findFirst({
      where: {
        id: body.deviceId,
        ...buildTenantFilter(ctx, 'tenantId'),
      },
      select: { id: true, tenantId: true },
    })
    if (!device) return NextResponse.json({ error: 'Device not found in tenant scope' }, { status: 404 })

    const created = await db.dairyIoTPing.create({
      data: {
        deviceId: body.deviceId,
        pingType: body.pingType || 'location',
        lat: body.lat !== undefined && body.lat !== null ? parseFloat(body.lat) : null,
        lng: body.lng !== undefined && body.lng !== null ? parseFloat(body.lng) : null,
        tempC: body.tempC !== undefined && body.tempC !== null ? parseFloat(body.tempC) : null,
        data: body.data || null,
        batteryPct:
          body.batteryPct !== undefined && body.batteryPct !== null ? parseFloat(body.batteryPct) : null,
        pingedAt: body.pingedAt ? new Date(body.pingedAt) : new Date(),
      },
    })

    // Update device's lastPing* fields for convenience.
    await db.dairyIoTDevice
      .update({
        where: { id: body.deviceId },
        data: {
          lastPingAt: created.pingedAt,
          lastPingLat: created.lat,
          lastPingLng: created.lng,
          batteryPct: created.batteryPct ?? undefined,
        },
      })
      .catch(() => {
        /* ignore update errors — ping is still recorded */
      })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyIoTPing create error:', error)
    return NextResponse.json(
      { error: 'Failed to create IoT ping', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
