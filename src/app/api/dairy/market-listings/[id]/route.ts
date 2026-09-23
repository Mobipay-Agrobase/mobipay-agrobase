import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyMarketListing.findFirst({
      where: { id, ...tf },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { orders: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Market listing not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyMarketListing detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch market listing' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyMarketListing.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Market listing not found' }, { status: 404 })
    const body = await req.json()

    const updated = await db.dairyMarketListing.update({
      where: { id },
      data: {
        sellerType: body.sellerType !== undefined ? body.sellerType : undefined,
        sellerId: body.sellerId !== undefined ? body.sellerId : undefined,
        sellerName: body.sellerName !== undefined ? body.sellerName : undefined,
        listingType: body.listingType !== undefined ? body.listingType : undefined,
        animalId: body.animalId !== undefined ? body.animalId || null : undefined,
        title: body.title !== undefined ? body.title : undefined,
        description: body.description !== undefined ? body.description || null : undefined,
        price: body.price !== undefined ? (body.price ? parseFloat(body.price) : undefined) : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        quantity: body.quantity !== undefined ? (body.quantity ? parseInt(body.quantity) : 1) : undefined,
        unit: body.unit !== undefined ? body.unit : undefined,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl || null : undefined,
        location: body.location !== undefined ? body.location || null : undefined,
        status: body.status !== undefined ? body.status : undefined,
        expiresAt: body.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyMarketListing update error:', error)
    return NextResponse.json(
      { error: 'Failed to update market listing', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyMarketListing.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Market listing not found' }, { status: 404 })
    await db.dairyMarketListing.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyMarketListing delete error:', error)
    return NextResponse.json({ error: 'Failed to delete market listing' }, { status: 500 })
  }
}
