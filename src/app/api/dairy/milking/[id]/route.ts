import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyMilkingRecord.findFirst({
      where: { id, ...tf },
      include: { cow: { select: { id: true, name: true, cowCode: true } } },
    })
    if (!item) return NextResponse.json({ error: 'Milking record not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyMilkingRecord detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch milking record' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyMilkingRecord.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Milking record not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyMilkingRecord.update({
      where: { id },
      data: {
        cowId: body.cowId !== undefined ? body.cowId : undefined,
        milkingDate: body.milkingDate !== undefined ? new Date(body.milkingDate) : undefined,
        session: body.session !== undefined ? body.session : undefined,
        milkYieldLitres: body.milkYieldLitres !== undefined ? parseFloat(body.milkYieldLitres) : undefined,
        fatContentPct: body.fatContentPct !== undefined ? (body.fatContentPct ? parseFloat(body.fatContentPct) : null) : undefined,
        proteinContentPct: body.proteinContentPct !== undefined ? (body.proteinContentPct ? parseFloat(body.proteinContentPct) : null) : undefined,
        qualityGrade: body.qualityGrade !== undefined ? body.qualityGrade || null : undefined,
        storageTempC: body.storageTempC !== undefined ? (body.storageTempC ? parseFloat(body.storageTempC) : null) : undefined,
        bulkTankId: body.bulkTankId !== undefined ? body.bulkTankId || null : undefined,
        recordedBy: body.recordedBy !== undefined ? body.recordedBy || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyMilkingRecord update error:', error)
    return NextResponse.json(
      { error: 'Failed to update milking record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyMilkingRecord.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Milking record not found' }, { status: 404 })
    await db.dairyMilkingRecord.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyMilkingRecord delete error:', error)
    return NextResponse.json({ error: 'Failed to delete milking record' }, { status: 500 })
  }
}
