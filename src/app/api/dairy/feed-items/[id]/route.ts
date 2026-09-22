import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyFeedItem.findFirst({
      where: { id, ...tf },
      include: { supplier: { select: { id: true, name: true } }, _count: { select: { feedSchedules: true } } },
    })
    if (!item) return NextResponse.json({ error: 'Feed item not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyFeedItem detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch feed item' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyFeedItem.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Feed item not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyFeedItem.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        feedType: body.feedType !== undefined ? body.feedType || null : undefined,
        quantityInStock: body.quantityInStock !== undefined ? (body.quantityInStock ? parseFloat(body.quantityInStock) : 0) : undefined,
        unitPrice: body.unitPrice !== undefined ? (body.unitPrice ? parseFloat(body.unitPrice) : 0) : undefined,
        nutritionalValue: body.nutritionalValue !== undefined ? body.nutritionalValue || null : undefined,
        supplierId: body.supplierId !== undefined ? body.supplierId || null : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyFeedItem update error:', error)
    return NextResponse.json(
      { error: 'Failed to update feed item', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyFeedItem.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Feed item not found' }, { status: 404 })
    await db.dairyFeedItem.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyFeedItem delete error:', error)
    return NextResponse.json({ error: 'Failed to delete feed item' }, { status: 500 })
  }
}
