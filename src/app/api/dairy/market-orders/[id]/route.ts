import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyMarketOrder.findFirst({
      where: { id, ...tf },
      include: {
        listing: { select: { id: true, title: true, listingType: true, price: true, status: true, sellerName: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Market order not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyMarketOrder detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch market order' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyMarketOrder.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Market order not found' }, { status: 404 })
    const body = await req.json()

    // Recompute totalAmount if quantity or unitPrice changes
    const quantity = body.quantity !== undefined ? (body.quantity ? parseInt(body.quantity) : 1) : existing.quantity
    const unitPrice = body.unitPrice !== undefined ? (body.unitPrice ? parseFloat(body.unitPrice) : existing.unitPrice) : existing.unitPrice
    let totalAmount: number | undefined = undefined
    if (body.totalAmount !== undefined) {
      totalAmount = body.totalAmount ? parseFloat(body.totalAmount) : undefined
    } else if (body.quantity !== undefined || body.unitPrice !== undefined) {
      totalAmount = quantity * unitPrice
    }

    const updated = await db.dairyMarketOrder.update({
      where: { id },
      data: {
        listingId: body.listingId !== undefined ? body.listingId : undefined,
        buyerType: body.buyerType !== undefined ? body.buyerType : undefined,
        buyerId: body.buyerId !== undefined ? body.buyerId : undefined,
        buyerName: body.buyerName !== undefined ? body.buyerName : undefined,
        quantity: body.quantity !== undefined ? (body.quantity ? parseInt(body.quantity) : 1) : undefined,
        unitPrice: body.unitPrice !== undefined ? (body.unitPrice ? parseFloat(body.unitPrice) : undefined) : undefined,
        totalAmount,
        currency: body.currency !== undefined ? body.currency : undefined,
        status: body.status !== undefined ? body.status : undefined,
        escrowRef: body.escrowRef !== undefined ? body.escrowRef || null : undefined,
        paymentStatus: body.paymentStatus !== undefined ? body.paymentStatus : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyMarketOrder update error:', error)
    return NextResponse.json(
      { error: 'Failed to update market order', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyMarketOrder.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Market order not found' }, { status: 404 })
    await db.dairyMarketOrder.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyMarketOrder delete error:', error)
    return NextResponse.json({ error: 'Failed to delete market order' }, { status: 500 })
  }
}
