import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyShade.findFirst({
      where: { id, ...tf },
      include: { _count: { select: { cows: true } }, cows: { select: { id: true, name: true, cowCode: true }, take: 20 } },
    })
    if (!item) return NextResponse.json({ error: 'Shed not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyShade detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch shed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyShade.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Shed not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyShade.update({
      where: { id },
      data: {
        farmId: body.farmId !== undefined ? body.farmId || null : undefined,
        shadeNumber: body.shadeNumber !== undefined ? body.shadeNumber : undefined,
        dimensionsSqm: body.dimensionsSqm !== undefined ? (body.dimensionsSqm ? parseFloat(body.dimensionsSqm) : null) : undefined,
        ventilationType: body.ventilationType !== undefined ? body.ventilationType || null : undefined,
        beddingType: body.beddingType !== undefined ? body.beddingType || null : undefined,
        capacity: body.capacity !== undefined ? (body.capacity ? parseInt(body.capacity) : null) : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyShade update error:', error)
    return NextResponse.json(
      { error: 'Failed to update shed', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyShade.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Shed not found' }, { status: 404 })
    await db.dairyShade.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyShade delete error:', error)
    return NextResponse.json({ error: 'Failed to delete shed' }, { status: 500 })
  }
}
