import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairySustainabilityRecord.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Sustainability record not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairySustainabilityRecord detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch sustainability record' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairySustainabilityRecord.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Sustainability record not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairySustainabilityRecord.update({
      where: { id },
      data: {
        recordType: body.recordType !== undefined ? body.recordType : undefined,
        recordDate:
          body.recordDate !== undefined ? (body.recordDate ? new Date(body.recordDate) : new Date()) : undefined,
        farmerId: body.farmerId !== undefined ? body.farmerId || null : undefined,
        farmerName: body.farmerName !== undefined ? body.farmerName || null : undefined,
        cowId: body.cowId !== undefined ? body.cowId || null : undefined,
        metric: body.metric !== undefined ? body.metric : undefined,
        value: body.value !== undefined ? (body.value !== null && body.value !== '' ? parseFloat(body.value) : 0) : undefined,
        unit: body.unit !== undefined ? body.unit : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairySustainabilityRecord update error:', error)
    return NextResponse.json(
      { error: 'Failed to update sustainability record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairySustainabilityRecord.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Sustainability record not found' }, { status: 404 })
    await db.dairySustainabilityRecord.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairySustainabilityRecord delete error:', error)
    return NextResponse.json({ error: 'Failed to delete sustainability record' }, { status: 500 })
  }
}
