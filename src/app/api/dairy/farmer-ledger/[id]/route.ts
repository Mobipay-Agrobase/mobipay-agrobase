import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyFarmerLedger.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Ledger entry not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyFarmerLedger detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch ledger entry' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyFarmerLedger.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Ledger entry not found' }, { status: 404 })
    const body = await req.json()

    const updated = await db.dairyFarmerLedger.update({
      where: { id },
      data: {
        farmerId: body.farmerId !== undefined ? body.farmerId : undefined,
        farmerName: body.farmerName !== undefined ? body.farmerName : undefined,
        entryType: body.entryType !== undefined ? body.entryType : undefined,
        direction: body.direction !== undefined ? body.direction : undefined,
        amount: body.amount !== undefined ? (body.amount ? parseFloat(body.amount) : undefined) : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        refType: body.refType !== undefined ? body.refType || null : undefined,
        refId: body.refId !== undefined ? body.refId || null : undefined,
        runningBalance: body.runningBalance !== undefined ? (body.runningBalance ? parseFloat(body.runningBalance) : 0) : undefined,
        narrative: body.narrative !== undefined ? body.narrative || null : undefined,
        postedAt: body.postedAt !== undefined ? (body.postedAt ? new Date(body.postedAt) : undefined) : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyFarmerLedger update error:', error)
    return NextResponse.json(
      { error: 'Failed to update ledger entry', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyFarmerLedger.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Ledger entry not found' }, { status: 404 })
    await db.dairyFarmerLedger.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyFarmerLedger delete error:', error)
    return NextResponse.json({ error: 'Failed to delete ledger entry' }, { status: 500 })
  }
}
