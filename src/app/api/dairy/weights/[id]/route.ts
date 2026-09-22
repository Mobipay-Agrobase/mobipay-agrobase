import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyAnimalWeight.findFirst({
      where: { id, ...tf },
      include: { cow: { select: { id: true, name: true, cowCode: true } } },
    })
    if (!item) return NextResponse.json({ error: 'Weight record not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyAnimalWeight detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch weight record' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyAnimalWeight.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Weight record not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyAnimalWeight.update({
      where: { id },
      data: {
        cowId: body.cowId !== undefined ? body.cowId : undefined,
        weightDate: body.weightDate !== undefined ? new Date(body.weightDate) : undefined,
        weightKg: body.weightKg !== undefined ? parseFloat(body.weightKg) : undefined,
        bodyConditionScore: body.bodyConditionScore !== undefined ? (body.bodyConditionScore ? parseFloat(body.bodyConditionScore) : null) : undefined,
        measurementMethod: body.measurementMethod !== undefined ? body.measurementMethod || null : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyAnimalWeight update error:', error)
    return NextResponse.json(
      { error: 'Failed to update weight record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyAnimalWeight.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Weight record not found' }, { status: 404 })
    await db.dairyAnimalWeight.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyAnimalWeight delete error:', error)
    return NextResponse.json({ error: 'Failed to delete weight record' }, { status: 500 })
  }
}
