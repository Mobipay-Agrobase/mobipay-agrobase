import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyFeedSchedule.findFirst({
      where: { id, ...tf },
      include: {
        cow: { select: { id: true, name: true, cowCode: true } },
        feedItem: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Feed schedule not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyFeedSchedule detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch feed schedule' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyFeedSchedule.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Feed schedule not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyFeedSchedule.update({
      where: { id },
      data: {
        cowId: body.cowId !== undefined ? body.cowId : undefined,
        feedItemId: body.feedItemId !== undefined ? body.feedItemId : undefined,
        feedTime: body.feedTime !== undefined ? body.feedTime : undefined,
        durationMinutes: body.durationMinutes !== undefined ? (body.durationMinutes ? parseInt(body.durationMinutes) : null) : undefined,
        feedAmountKg: body.feedAmountKg !== undefined ? (body.feedAmountKg ? parseFloat(body.feedAmountKg) : 0) : undefined,
        staffId: body.staffId !== undefined ? body.staffId || null : undefined,
        feedDate: body.feedDate !== undefined ? (body.feedDate ? new Date(body.feedDate) : new Date()) : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyFeedSchedule update error:', error)
    return NextResponse.json(
      { error: 'Failed to update feed schedule', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyFeedSchedule.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Feed schedule not found' }, { status: 404 })
    await db.dairyFeedSchedule.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyFeedSchedule delete error:', error)
    return NextResponse.json({ error: 'Failed to delete feed schedule' }, { status: 500 })
  }
}
