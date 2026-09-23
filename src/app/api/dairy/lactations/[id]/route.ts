import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyLactation.findFirst({
      where: { id, ...tf },
      include: { cow: { select: { id: true, name: true, cowCode: true, tagNumber: true } } },
    })
    if (!item) return NextResponse.json({ error: 'Lactation not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyLactation detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch lactation' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyLactation.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Lactation not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyLactation.update({
      where: { id },
      data: {
        cowId: body.cowId !== undefined ? body.cowId : undefined,
        lactationNumber: body.lactationNumber !== undefined ? parseInt(body.lactationNumber) : undefined,
        calvingDate: body.calvingDate !== undefined ? (body.calvingDate ? new Date(body.calvingDate) : undefined) : undefined,
        startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : undefined) : undefined,
        endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : undefined,
        peakYieldLitres:
          body.peakYieldLitres !== undefined ? (body.peakYieldLitres ? parseFloat(body.peakYieldLitres) : null) : undefined,
        peakDay: body.peakDay !== undefined ? (body.peakDay ? parseInt(body.peakDay) : null) : undefined,
        totalYieldLitres:
          body.totalYieldLitres !== undefined ? (body.totalYieldLitres ? parseFloat(body.totalYieldLitres) : null) : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyLactation update error:', error)
    return NextResponse.json(
      { error: 'Failed to update lactation', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyLactation.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Lactation not found' }, { status: 404 })
    await db.dairyLactation.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyLactation delete error:', error)
    return NextResponse.json({ error: 'Failed to delete lactation' }, { status: 500 })
  }
}
