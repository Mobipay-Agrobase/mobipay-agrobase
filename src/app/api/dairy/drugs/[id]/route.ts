import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyDrugCatalog.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Drug not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyDrugCatalog detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch drug' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyDrugCatalog.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Drug not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyDrugCatalog.update({
      where: { id },
      data: {
        drugName: body.drugName !== undefined ? body.drugName : undefined,
        genericName: body.genericName !== undefined ? body.genericName || null : undefined,
        category: body.category !== undefined ? body.category || null : undefined,
        manufacturer: body.manufacturer !== undefined ? body.manufacturer || null : undefined,
        unitSize: body.unitSize !== undefined ? body.unitSize || null : undefined,
        unitPrice:
          body.unitPrice !== undefined ? (body.unitPrice ? parseFloat(body.unitPrice) : null) : undefined,
        withdrawalPeriodDays:
          body.withdrawalPeriodDays !== undefined
            ? body.withdrawalPeriodDays
              ? parseInt(body.withdrawalPeriodDays)
              : null
            : undefined,
        batchNumber: body.batchNumber !== undefined ? body.batchNumber || null : undefined,
        expiryDate: body.expiryDate !== undefined ? (body.expiryDate ? new Date(body.expiryDate) : null) : undefined,
        stockQuantity:
          body.stockQuantity !== undefined ? (body.stockQuantity ? parseFloat(body.stockQuantity) : null) : undefined,
        minStockLevel:
          body.minStockLevel !== undefined ? (body.minStockLevel ? parseFloat(body.minStockLevel) : null) : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyDrugCatalog update error:', error)
    return NextResponse.json(
      { error: 'Failed to update drug', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyDrugCatalog.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Drug not found' }, { status: 404 })
    await db.dairyDrugCatalog.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyDrugCatalog delete error:', error)
    return NextResponse.json({ error: 'Failed to delete drug' }, { status: 500 })
  }
}
