import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyProcessingRecord.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Processing record not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyProcessingRecord detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch processing record' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyProcessingRecord.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Processing record not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyProcessingRecord.update({
      where: { id },
      data: {
        processingDate: body.processingDate !== undefined ? new Date(body.processingDate) : undefined,
        species: body.species !== undefined ? body.species : undefined,
        numberProcessed: body.numberProcessed !== undefined ? parseInt(body.numberProcessed) : undefined,
        carcassWeightKg: body.carcassWeightKg !== undefined ? parseFloat(body.carcassWeightKg) : undefined,
        yieldPct: body.yieldPct !== undefined ? (body.yieldPct ? parseFloat(body.yieldPct) : null) : undefined,
        processingPlantId: body.processingPlantId !== undefined ? body.processingPlantId || null : undefined,
        productCategories: body.productCategories !== undefined
          ? (body.productCategories ? (Array.isArray(body.productCategories) ? JSON.stringify(body.productCategories) : String(body.productCategories)) : null)
          : undefined,
        coldStorageId: body.coldStorageId !== undefined ? body.coldStorageId || null : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyProcessingRecord update error:', error)
    return NextResponse.json(
      { error: 'Failed to update processing record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyProcessingRecord.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Processing record not found' }, { status: 404 })
    await db.dairyProcessingRecord.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyProcessingRecord delete error:', error)
    return NextResponse.json({ error: 'Failed to delete processing record' }, { status: 500 })
  }
}
