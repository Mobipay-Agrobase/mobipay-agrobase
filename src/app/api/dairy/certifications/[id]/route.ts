import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyCertification.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Certification not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyCertification detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch certification' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyCertification.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Certification not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyCertification.update({
      where: { id },
      data: {
        standard: body.standard !== undefined ? body.standard : undefined,
        assessmentDate: body.assessmentDate !== undefined ? new Date(body.assessmentDate) : undefined,
        assessorName: body.assessorName !== undefined ? body.assessorName : undefined,
        animalWelfare: body.animalWelfare !== undefined ? body.animalWelfare : undefined,
        biosecurity: body.biosecurity !== undefined ? body.biosecurity : undefined,
        wasteManagement: body.wasteManagement !== undefined ? body.wasteManagement : undefined,
        climateSmart: body.climateSmart !== undefined ? body.climateSmart : undefined,
        outcome: body.outcome !== undefined ? body.outcome : undefined,
        totalScorePct: body.totalScorePct !== undefined ? (body.totalScorePct ? parseFloat(body.totalScorePct) : null) : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyCertification update error:', error)
    return NextResponse.json(
      { error: 'Failed to update certification', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyCertification.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Certification not found' }, { status: 404 })
    await db.dairyCertification.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyCertification delete error:', error)
    return NextResponse.json({ error: 'Failed to delete certification' }, { status: 500 })
  }
}
