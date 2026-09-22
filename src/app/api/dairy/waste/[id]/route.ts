import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyWasteRecord.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Waste record not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyWasteRecord detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch waste record' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyWasteRecord.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Waste record not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyWasteRecord.update({
      where: { id },
      data: {
        wasteDate: body.wasteDate !== undefined ? new Date(body.wasteDate) : undefined,
        wasteType: body.wasteType !== undefined ? body.wasteType : undefined,
        quantityKg: body.quantityKg !== undefined ? (body.quantityKg ? parseFloat(body.quantityKg) : null) : undefined,
        handlingMethod: body.handlingMethod !== undefined ? body.handlingMethod : undefined,
        treatmentDurationDays: body.treatmentDurationDays !== undefined ? (body.treatmentDurationDays ? parseInt(body.treatmentDurationDays) : null) : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyWasteRecord update error:', error)
    return NextResponse.json(
      { error: 'Failed to update waste record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyWasteRecord.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Waste record not found' }, { status: 404 })
    await db.dairyWasteRecord.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyWasteRecord delete error:', error)
    return NextResponse.json({ error: 'Failed to delete waste record' }, { status: 500 })
  }
}
