import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyWithdrawalLock.findFirst({
      where: { id, ...tf },
      include: { cow: { select: { id: true, name: true, cowCode: true, tagNumber: true } } },
    })
    if (!item) return NextResponse.json({ error: 'Withdrawal lock not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyWithdrawalLock detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch withdrawal lock' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyWithdrawalLock.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Withdrawal lock not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyWithdrawalLock.update({
      where: { id },
      data: {
        cowId: body.cowId !== undefined ? body.cowId : undefined,
        reason: body.reason !== undefined ? body.reason : undefined,
        treatmentType: body.treatmentType !== undefined ? body.treatmentType : undefined,
        startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : undefined) : undefined,
        endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : undefined) : undefined,
        milkWithheld: body.milkWithheld !== undefined ? !!body.milkWithheld : undefined,
        meatWithheld: body.meatWithheld !== undefined ? !!body.meatWithheld : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
        triggeredBy: body.triggeredBy !== undefined ? body.triggeredBy || null : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyWithdrawalLock update error:', error)
    return NextResponse.json(
      { error: 'Failed to update withdrawal lock', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyWithdrawalLock.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Withdrawal lock not found' }, { status: 404 })
    await db.dairyWithdrawalLock.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyWithdrawalLock delete error:', error)
    return NextResponse.json({ error: 'Failed to delete withdrawal lock' }, { status: 500 })
  }
}
