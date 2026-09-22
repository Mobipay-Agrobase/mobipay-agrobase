import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyInspection.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyInspection detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch inspection' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyInspection.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyInspection.update({
      where: { id },
      data: {
        batchOrFarmId: body.batchOrFarmId !== undefined ? body.batchOrFarmId : undefined,
        inspectionDate: body.inspectionDate !== undefined ? new Date(body.inspectionDate) : undefined,
        inspector: body.inspector !== undefined ? body.inspector : undefined,
        scope: body.scope !== undefined ? body.scope : undefined,
        observations: body.observations !== undefined ? body.observations || null : undefined,
        nonConformance: body.nonConformance !== undefined ? !!body.nonConformance : undefined,
        correctiveActions: body.correctiveActions !== undefined ? body.correctiveActions || null : undefined,
        followUpDate: body.followUpDate !== undefined ? (body.followUpDate ? new Date(body.followUpDate) : null) : undefined,
        status: body.status !== undefined ? body.status : undefined,
        reportUrl: body.reportUrl !== undefined ? body.reportUrl || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyInspection update error:', error)
    return NextResponse.json(
      { error: 'Failed to update inspection', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyInspection.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    await db.dairyInspection.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyInspection delete error:', error)
    return NextResponse.json({ error: 'Failed to delete inspection' }, { status: 500 })
  }
}
