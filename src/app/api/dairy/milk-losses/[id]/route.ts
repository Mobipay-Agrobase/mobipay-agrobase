import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyMilkLoss.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Milk loss record not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyMilkLoss detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch milk loss record' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyMilkLoss.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Milk loss record not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyMilkLoss.update({
      where: { id },
      data: {
        tripId: body.tripId !== undefined ? body.tripId || null : undefined,
        pickupId: body.pickupId !== undefined ? body.pickupId || null : undefined,
        lossDate: body.lossDate !== undefined ? (body.lossDate ? new Date(body.lossDate) : undefined) : undefined,
        lossType: body.lossType !== undefined ? body.lossType : undefined,
        litresLost: body.litresLost !== undefined ? (body.litresLost ? parseFloat(body.litresLost) : undefined) : undefined,
        valueLost: body.valueLost !== undefined ? (body.valueLost ? parseFloat(body.valueLost) : null) : undefined,
        responsibleParty: body.responsibleParty !== undefined ? body.responsibleParty || null : undefined,
        reconciled: body.reconciled !== undefined ? !!body.reconciled : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyMilkLoss update error:', error)
    return NextResponse.json(
      { error: 'Failed to update milk loss record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyMilkLoss.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Milk loss record not found' }, { status: 404 })
    await db.dairyMilkLoss.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyMilkLoss delete error:', error)
    return NextResponse.json({ error: 'Failed to delete milk loss record' }, { status: 500 })
  }
}
