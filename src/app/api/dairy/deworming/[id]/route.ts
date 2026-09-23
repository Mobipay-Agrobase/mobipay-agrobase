import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyDewormingRecord.findFirst({
      where: { id, ...tf },
      include: { cow: { select: { id: true, name: true, cowCode: true, tagNumber: true } } },
    })
    if (!item) return NextResponse.json({ error: 'Deworming record not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyDewormingRecord detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch deworming record' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyDewormingRecord.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Deworming record not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyDewormingRecord.update({
      where: { id },
      data: {
        cowId: body.cowId !== undefined ? body.cowId : undefined,
        dewormingDate:
          body.dewormingDate !== undefined ? (body.dewormingDate ? new Date(body.dewormingDate) : undefined) : undefined,
        productUsed: body.productUsed !== undefined ? body.productUsed : undefined,
        dose: body.dose !== undefined ? body.dose : undefined,
        administrationRoute: body.administrationRoute !== undefined ? body.administrationRoute : undefined,
        nextDueDate:
          body.nextDueDate !== undefined ? (body.nextDueDate ? new Date(body.nextDueDate) : null) : undefined,
        administeredBy: body.administeredBy !== undefined ? body.administeredBy || null : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyDewormingRecord update error:', error)
    return NextResponse.json(
      { error: 'Failed to update deworming record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyDewormingRecord.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Deworming record not found' }, { status: 404 })
    await db.dairyDewormingRecord.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyDewormingRecord delete error:', error)
    return NextResponse.json({ error: 'Failed to delete deworming record' }, { status: 500 })
  }
}
