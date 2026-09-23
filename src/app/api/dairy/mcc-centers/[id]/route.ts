import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyMccCenter.findFirst({
      where: { id, ...tf },
      include: {
        offtaker: { select: { id: true, name: true, offtakerType: true, contactPhone: true } },
        intakes: { take: 30, orderBy: { intakeDate: 'desc' } },
        _count: { select: { intakes: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'MCC center not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyMccCenter detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch MCC center' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyMccCenter.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'MCC center not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyMccCenter.update({
      where: { id },
      data: {
        offtakerId: body.offtakerId !== undefined ? body.offtakerId || null : undefined,
        name: body.name !== undefined ? body.name : undefined,
        capacityLitres: body.capacityLitres !== undefined ? (body.capacityLitres ? parseInt(body.capacityLitres) : null) : undefined,
        hasCooler: body.hasCooler !== undefined ? !!body.hasCooler : undefined,
        hasAnalyzer: body.hasAnalyzer !== undefined ? !!body.hasAnalyzer : undefined,
        lat: body.lat !== undefined ? (body.lat ? parseFloat(body.lat) : null) : undefined,
        lng: body.lng !== undefined ? (body.lng ? parseFloat(body.lng) : null) : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyMccCenter update error:', error)
    return NextResponse.json(
      { error: 'Failed to update MCC center', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyMccCenter.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'MCC center not found' }, { status: 404 })
    await db.dairyMccCenter.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyMccCenter delete error:', error)
    return NextResponse.json({ error: 'Failed to delete MCC center' }, { status: 500 })
  }
}
