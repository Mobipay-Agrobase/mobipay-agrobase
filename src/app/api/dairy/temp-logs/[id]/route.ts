import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyTempLog.findFirst({
      where: { id, trip: { ...tf } },
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
    })
    if (!item) return NextResponse.json({ error: 'Temperature log not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyTempLog detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch temperature log' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyTempLog.findFirst({ where: { id, trip: { ...tf } } })
    if (!existing) return NextResponse.json({ error: 'Temperature log not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyTempLog.update({
      where: { id },
      data: {
        tripId: body.tripId !== undefined ? body.tripId : undefined,
        tempC: body.tempC !== undefined ? (body.tempC ? parseFloat(body.tempC) : undefined) : undefined,
        loggedAt: body.loggedAt !== undefined ? (body.loggedAt ? new Date(body.loggedAt) : undefined) : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyTempLog update error:', error)
    return NextResponse.json(
      { error: 'Failed to update temperature log', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyTempLog.findFirst({ where: { id, trip: { ...tf } } })
    if (!existing) return NextResponse.json({ error: 'Temperature log not found' }, { status: 404 })
    await db.dairyTempLog.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyTempLog delete error:', error)
    return NextResponse.json({ error: 'Failed to delete temperature log' }, { status: 500 })
  }
}
