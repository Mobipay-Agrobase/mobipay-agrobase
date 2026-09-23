import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyOfftaker.findFirst({
      where: { id, ...tf },
      include: {
        mccCenters: { take: 20, orderBy: { createdAt: 'desc' } },
        _count: { select: { mccCenters: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Offtaker not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyOfftaker detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch offtaker' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyOfftaker.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Offtaker not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyOfftaker.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        offtakerType: body.offtakerType !== undefined ? body.offtakerType : undefined,
        contactPhone: body.contactPhone !== undefined ? body.contactPhone || null : undefined,
        contactEmail: body.contactEmail !== undefined ? body.contactEmail || null : undefined,
        location: body.location !== undefined ? body.location || null : undefined,
        paymentTerms: body.paymentTerms !== undefined ? body.paymentTerms : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyOfftaker update error:', error)
    return NextResponse.json(
      { error: 'Failed to update offtaker', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyOfftaker.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Offtaker not found' }, { status: 404 })
    await db.dairyOfftaker.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyOfftaker delete error:', error)
    return NextResponse.json({ error: 'Failed to delete offtaker' }, { status: 500 })
  }
}
