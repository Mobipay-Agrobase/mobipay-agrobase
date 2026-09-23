import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyFarmQualityTest.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Farm quality test not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyFarmQualityTest detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch farm quality test' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyFarmQualityTest.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Farm quality test not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyFarmQualityTest.update({
      where: { id },
      data: {
        cowId: body.cowId !== undefined ? body.cowId || null : undefined,
        farmerId: body.farmerId !== undefined ? body.farmerId || null : undefined,
        farmerName: body.farmerName !== undefined ? body.farmerName || null : undefined,
        testDate: body.testDate !== undefined ? (body.testDate ? new Date(body.testDate) : undefined) : undefined,
        testType: body.testType !== undefined ? body.testType : undefined,
        result: body.result !== undefined ? body.result : undefined,
        unit: body.unit !== undefined ? body.unit || null : undefined,
        isAbnormal: body.isAbnormal !== undefined ? !!body.isAbnormal : undefined,
        mastitisRisk: body.mastitisRisk !== undefined ? body.mastitisRisk || null : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
        testedBy: body.testedBy !== undefined ? body.testedBy || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyFarmQualityTest update error:', error)
    return NextResponse.json(
      { error: 'Failed to update farm quality test', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyFarmQualityTest.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Farm quality test not found' }, { status: 404 })
    await db.dairyFarmQualityTest.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyFarmQualityTest delete error:', error)
    return NextResponse.json({ error: 'Failed to delete farm quality test' }, { status: 500 })
  }
}
