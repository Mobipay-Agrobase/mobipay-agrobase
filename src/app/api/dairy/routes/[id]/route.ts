import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyTransportRoute.findFirst({
      where: { id, ...tf },
      include: {
        trips: { take: 20, orderBy: { tripDate: 'desc' }, include: { transporter: { select: { id: true, fullName: true } }, vehicle: { select: { id: true, plateNo: true } } } },
        _count: { select: { trips: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Transport route not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyTransportRoute detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch transport route' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyTransportRoute.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Transport route not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyTransportRoute.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        mccId: body.mccId !== undefined ? body.mccId || null : undefined,
        processorId: body.processorId !== undefined ? body.processorId || null : undefined,
        distanceKm: body.distanceKm !== undefined ? (body.distanceKm ? parseFloat(body.distanceKm) : null) : undefined,
        cutoffTime: body.cutoffTime !== undefined ? body.cutoffTime || null : undefined,
        stopsJson: body.stopsJson !== undefined ? body.stopsJson || null : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyTransportRoute update error:', error)
    return NextResponse.json(
      { error: 'Failed to update transport route', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyTransportRoute.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Transport route not found' }, { status: 404 })
    await db.dairyTransportRoute.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyTransportRoute delete error:', error)
    return NextResponse.json({ error: 'Failed to delete transport route' }, { status: 500 })
  }
}
