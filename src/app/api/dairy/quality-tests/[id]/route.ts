import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyMilkQualityTest.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Quality test not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyMilkQualityTest detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch quality test' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyMilkQualityTest.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Quality test not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyMilkQualityTest.update({
      where: { id },
      data: {
        batchId: body.batchId !== undefined ? body.batchId : undefined,
        tankId: body.tankId !== undefined ? body.tankId || null : undefined,
        collectionDate: body.collectionDate !== undefined ? new Date(body.collectionDate) : undefined,
        samplingTime: body.samplingTime !== undefined ? body.samplingTime : undefined,
        testParameter: body.testParameter !== undefined ? body.testParameter : undefined,
        testResult: body.testResult !== undefined ? body.testResult : undefined,
        labName: body.labName !== undefined ? body.labName || null : undefined,
        reportUrl: body.reportUrl !== undefined ? body.reportUrl || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyMilkQualityTest update error:', error)
    return NextResponse.json(
      { error: 'Failed to update quality test', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyMilkQualityTest.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Quality test not found' }, { status: 404 })
    await db.dairyMilkQualityTest.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyMilkQualityTest delete error:', error)
    return NextResponse.json({ error: 'Failed to delete quality test' }, { status: 500 })
  }
}
