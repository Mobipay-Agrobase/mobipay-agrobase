import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairySupplier.findFirst({
      where: { id, ...tf },
      include: { _count: { select: { feedItems: true } }, feedItems: { select: { id: true, name: true, feedType: true }, take: 20 } },
    })
    if (!item) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairySupplier detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairySupplier.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairySupplier.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        supplierType: body.supplierType !== undefined ? body.supplierType : undefined,
        contactNumber: body.contactNumber !== undefined ? body.contactNumber || null : undefined,
        email: body.email !== undefined ? body.email || null : undefined,
        productsSupplied: body.productsSupplied !== undefined
          ? (body.productsSupplied ? (Array.isArray(body.productsSupplied) ? JSON.stringify(body.productsSupplied) : String(body.productsSupplied)) : null)
          : undefined,
        rating: body.rating !== undefined ? body.rating || null : undefined,
        location: body.location !== undefined ? body.location || null : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairySupplier update error:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairySupplier.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    await db.dairySupplier.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairySupplier delete error:', error)
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
}
