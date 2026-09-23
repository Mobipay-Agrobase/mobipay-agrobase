import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyTransportTrip.findFirst({
      where: { id, ...tf },
      include: {
        route: true,
        transporter: { select: { id: true, fullName: true, transporterCode: true, phone: true } },
        vehicle: { select: { id: true, plateNo: true, vehicleType: true, capacityLitres: true } },
        pickups: { take: 30, orderBy: { pickedAt: 'desc' } },
        tempLogs: { take: 50, orderBy: { loggedAt: 'desc' } },
        tamperEvents: { take: 30, orderBy: { detectedAt: 'desc' } },
        _count: { select: { pickups: true, tempLogs: true, tamperEvents: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Transport trip not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyTransportTrip detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch transport trip' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyTransportTrip.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Transport trip not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyTransportTrip.update({
      where: { id },
      data: {
        routeId: body.routeId !== undefined ? body.routeId || null : undefined,
        transporterId: body.transporterId !== undefined ? body.transporterId : undefined,
        vehicleId: body.vehicleId !== undefined ? body.vehicleId : undefined,
        tripDate: body.tripDate !== undefined ? (body.tripDate ? new Date(body.tripDate) : undefined) : undefined,
        tripType: body.tripType !== undefined ? body.tripType : undefined,
        status: body.status !== undefined ? body.status : undefined,
        startedAt: body.startedAt !== undefined ? (body.startedAt ? new Date(body.startedAt) : null) : undefined,
        endedAt: body.endedAt !== undefined ? (body.endedAt ? new Date(body.endedAt) : null) : undefined,
        distanceKm: body.distanceKm !== undefined ? (body.distanceKm ? parseFloat(body.distanceKm) : null) : undefined,
        litresPicked: body.litresPicked !== undefined ? (body.litresPicked ? parseFloat(body.litresPicked) : null) : undefined,
        litresDelivered: body.litresDelivered !== undefined ? (body.litresDelivered ? parseFloat(body.litresDelivered) : null) : undefined,
        costTotal: body.costTotal !== undefined ? (body.costTotal ? parseFloat(body.costTotal) : null) : undefined,
        costPerLitre: body.costPerLitre !== undefined ? (body.costPerLitre ? parseFloat(body.costPerLitre) : null) : undefined,
        sealNoOut: body.sealNoOut !== undefined ? body.sealNoOut || null : undefined,
        sealNoIn: body.sealNoIn !== undefined ? body.sealNoIn || null : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyTransportTrip update error:', error)
    return NextResponse.json(
      { error: 'Failed to update transport trip', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyTransportTrip.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Transport trip not found' }, { status: 404 })
    await db.dairyTransportTrip.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyTransportTrip delete error:', error)
    return NextResponse.json({ error: 'Failed to delete transport trip' }, { status: 500 })
  }
}
