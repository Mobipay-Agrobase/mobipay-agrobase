import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyFeedLog.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Feed log not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyFeedLog detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch feed log' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyFeedLog.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Feed log not found' }, { status: 404 })
    const body = await req.json()
    const quantityKg = body.quantityKg !== undefined ? parseFloat(body.quantityKg) : undefined
    const costPerUnit = body.costPerUnit !== undefined ? (body.costPerUnit ? parseFloat(body.costPerUnit) : null) : undefined
    const totalCost = body.totalCost !== undefined
      ? (body.totalCost ? parseFloat(body.totalCost) : null)
      : (quantityKg !== undefined && costPerUnit !== null && costPerUnit !== undefined
          ? quantityKg * costPerUnit
          : undefined)
    const updated = await db.dairyFeedLog.update({
      where: { id },
      data: {
        feedDate: body.feedDate !== undefined ? new Date(body.feedDate) : undefined,
        feedType: body.feedType !== undefined ? body.feedType : undefined,
        quantityKg,
        costPerUnit,
        totalCost: totalCost !== undefined ? totalCost : undefined,
        feedConversionRatio: body.feedConversionRatio !== undefined ? (body.feedConversionRatio ? parseFloat(body.feedConversionRatio) : null) : undefined,
        cowId: body.cowId !== undefined ? body.cowId || null : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyFeedLog update error:', error)
    return NextResponse.json(
      { error: 'Failed to update feed log', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyFeedLog.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Feed log not found' }, { status: 404 })
    await db.dairyFeedLog.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyFeedLog delete error:', error)
    return NextResponse.json({ error: 'Failed to delete feed log' }, { status: 500 })
  }
}
