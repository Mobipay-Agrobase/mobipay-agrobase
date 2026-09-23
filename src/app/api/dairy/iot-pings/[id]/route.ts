import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const item = await db.dairyIoTPing.findFirst({
      where: { id, device: buildTenantFilter(ctx, 'tenantId') },
      include: {
        device: { select: { id: true, deviceUid: true, deviceType: true, tenantId: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'IoT ping not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyIoTPing detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch IoT ping' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const existing = await db.dairyIoTPing.findFirst({
      where: { id, device: buildTenantFilter(ctx, 'tenantId') },
    })
    if (!existing) return NextResponse.json({ error: 'IoT ping not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyIoTPing.update({
      where: { id },
      data: {
        pingType: body.pingType !== undefined ? body.pingType : undefined,
        lat: body.lat !== undefined ? (body.lat !== null ? parseFloat(body.lat) : null) : undefined,
        lng: body.lng !== undefined ? (body.lng !== null ? parseFloat(body.lng) : null) : undefined,
        tempC: body.tempC !== undefined ? (body.tempC !== null ? parseFloat(body.tempC) : null) : undefined,
        data: body.data !== undefined ? body.data || null : undefined,
        batteryPct:
          body.batteryPct !== undefined
            ? body.batteryPct !== null
              ? parseFloat(body.batteryPct)
              : null
            : undefined,
        pingedAt: body.pingedAt !== undefined ? (body.pingedAt ? new Date(body.pingedAt) : new Date()) : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyIoTPing update error:', error)
    return NextResponse.json(
      { error: 'Failed to update IoT ping', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const existing = await db.dairyIoTPing.findFirst({
      where: { id, device: buildTenantFilter(ctx, 'tenantId') },
    })
    if (!existing) return NextResponse.json({ error: 'IoT ping not found' }, { status: 404 })
    await db.dairyIoTPing.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyIoTPing delete error:', error)
    return NextResponse.json({ error: 'Failed to delete IoT ping' }, { status: 500 })
  }
}
