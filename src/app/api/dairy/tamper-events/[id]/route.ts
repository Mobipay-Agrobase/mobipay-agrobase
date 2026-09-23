import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyTamperEvent.findFirst({
      where: { id, ...tf },
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
    if (!item) return NextResponse.json({ error: 'Tamper event not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyTamperEvent detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch tamper event' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyTamperEvent.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Tamper event not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyTamperEvent.update({
      where: { id },
      data: {
        tripId: body.tripId !== undefined ? body.tripId : undefined,
        eventType: body.eventType !== undefined ? body.eventType : undefined,
        detectedAt: body.detectedAt !== undefined ? (body.detectedAt ? new Date(body.detectedAt) : undefined) : undefined,
        detailsJson: body.detailsJson !== undefined ? body.detailsJson || null : undefined,
        resolved: body.resolved !== undefined ? !!body.resolved : undefined,
        resolvedAt: body.resolvedAt !== undefined ? (body.resolvedAt ? new Date(body.resolvedAt) : null) : undefined,
        resolvedBy: body.resolvedBy !== undefined ? body.resolvedBy || null : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyTamperEvent update error:', error)
    return NextResponse.json(
      { error: 'Failed to update tamper event', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyTamperEvent.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Tamper event not found' }, { status: 404 })
    await db.dairyTamperEvent.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyTamperEvent delete error:', error)
    return NextResponse.json({ error: 'Failed to delete tamper event' }, { status: 500 })
  }
}
