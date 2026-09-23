import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyVehicle.findFirst({
      where: { id, ...tf },
      include: {
        transporter: { select: { id: true, fullName: true, transporterCode: true, phone: true } },
        trips: { take: 20, orderBy: { tripDate: 'desc' }, include: { transporter: { select: { id: true, fullName: true } } } },
        _count: { select: { trips: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyVehicle detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch vehicle' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyVehicle.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyVehicle.update({
      where: { id },
      data: {
        transporterId: body.transporterId !== undefined ? body.transporterId : undefined,
        plateNo: body.plateNo !== undefined ? body.plateNo : undefined,
        vehicleType: body.vehicleType !== undefined ? body.vehicleType : undefined,
        capacityLitres: body.capacityLitres !== undefined ? (body.capacityLitres ? parseInt(body.capacityLitres) : undefined) : undefined,
        coldChain: body.coldChain !== undefined ? !!body.coldChain : undefined,
        tempLoggerUid: body.tempLoggerUid !== undefined ? body.tempLoggerUid || null : undefined,
        gpsUid: body.gpsUid !== undefined ? body.gpsUid || null : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyVehicle update error:', error)
    return NextResponse.json(
      { error: 'Failed to update vehicle', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyVehicle.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    await db.dairyVehicle.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyVehicle delete error:', error)
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 })
  }
}
