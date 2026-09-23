import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyContract.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyContract detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyContract.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    const body = await req.json()

    const updated = await db.dairyContract.update({
      where: { id },
      data: {
        sellerOrgUnitId: body.sellerOrgUnitId !== undefined ? body.sellerOrgUnitId || null : undefined,
        buyerOfftakerId: body.buyerOfftakerId !== undefined ? body.buyerOfftakerId || null : undefined,
        contractNo: body.contractNo !== undefined ? body.contractNo : undefined,
        pricingType: body.pricingType !== undefined ? body.pricingType : undefined,
        pricePerLitre: body.pricePerLitre !== undefined ? (body.pricePerLitre ? parseFloat(body.pricePerLitre) : null) : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        minLitresDay: body.minLitresDay !== undefined ? (body.minLitresDay ? parseInt(body.minLitresDay) : null) : undefined,
        maxLitresDay: body.maxLitresDay !== undefined ? (body.maxLitresDay ? parseInt(body.maxLitresDay) : null) : undefined,
        startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : undefined) : undefined,
        endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : undefined) : undefined,
        penaltyTerms: body.penaltyTerms !== undefined ? body.penaltyTerms || null : undefined,
        status: body.status !== undefined ? body.status : undefined,
        documentUrl: body.documentUrl !== undefined ? body.documentUrl || null : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyContract update error:', error)
    return NextResponse.json(
      { error: 'Failed to update contract', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyContract.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    await db.dairyContract.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyContract delete error:', error)
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 })
  }
}
