import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyIoTDevice.findFirst({
      where: { id, ...tf },
      include: {
        pings: {
          take: 50,
          orderBy: { pingedAt: 'desc' },
        },
        _count: { select: { pings: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'IoT device not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyIoTDevice detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch IoT device' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyIoTDevice.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'IoT device not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyIoTDevice.update({
      where: { id },
      data: {
        deviceUid: body.deviceUid !== undefined ? body.deviceUid : undefined,
        deviceType: body.deviceType !== undefined ? body.deviceType : undefined,
        manufacturer: body.manufacturer !== undefined ? body.manufacturer || null : undefined,
        model: body.model !== undefined ? body.model || null : undefined,
        firmwareVersion: body.firmwareVersion !== undefined ? body.firmwareVersion || null : undefined,
        cowId: body.cowId !== undefined ? body.cowId || null : undefined,
        vehicleId: body.vehicleId !== undefined ? body.vehicleId || null : undefined,
        mccCenterId: body.mccCenterId !== undefined ? body.mccCenterId || null : undefined,
        batteryPct:
          body.batteryPct !== undefined
            ? body.batteryPct !== null && body.batteryPct !== ''
              ? parseFloat(body.batteryPct)
              : null
            : undefined,
        lastPingAt: body.lastPingAt !== undefined ? (body.lastPingAt ? new Date(body.lastPingAt) : null) : undefined,
        lastPingLat:
          body.lastPingLat !== undefined
            ? body.lastPingLat !== null && body.lastPingLat !== ''
              ? parseFloat(body.lastPingLat)
              : null
            : undefined,
        lastPingLng:
          body.lastPingLng !== undefined
            ? body.lastPingLng !== null && body.lastPingLng !== ''
              ? parseFloat(body.lastPingLng)
              : null
            : undefined,
        config: body.config !== undefined ? body.config || null : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyIoTDevice update error:', error)
    return NextResponse.json(
      { error: 'Failed to update IoT device', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyIoTDevice.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'IoT device not found' }, { status: 404 })
    await db.dairyIoTDevice.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyIoTDevice delete error:', error)
    return NextResponse.json({ error: 'Failed to delete IoT device' }, { status: 500 })
  }
}
