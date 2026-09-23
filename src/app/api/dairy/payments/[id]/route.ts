import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyPayment.findFirst({
      where: { id, ...tf },
      include: {
        batch: { select: { id: true, batchNo: true, status: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyPayment detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyPayment.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    const body = await req.json()

    const updated = await db.dairyPayment.update({
      where: { id },
      data: {
        batchId: body.batchId !== undefined ? body.batchId || null : undefined,
        payeeType: body.payeeType !== undefined ? body.payeeType : undefined,
        payeeId: body.payeeId !== undefined ? body.payeeId : undefined,
        payeeName: body.payeeName !== undefined ? body.payeeName : undefined,
        payeePhone: body.payeePhone !== undefined ? body.payeePhone || null : undefined,
        amount: body.amount !== undefined ? (body.amount ? parseFloat(body.amount) : undefined) : undefined,
        feeAmount: body.feeAmount !== undefined ? (body.feeAmount ? parseFloat(body.feeAmount) : 0) : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        channel: body.channel !== undefined ? body.channel : undefined,
        idempotencyKey: body.idempotencyKey !== undefined ? body.idempotencyKey : undefined,
        providerRef: body.providerRef !== undefined ? body.providerRef || null : undefined,
        status: body.status !== undefined ? body.status : undefined,
        failureReason: body.failureReason !== undefined ? body.failureReason || null : undefined,
        initiatedAt: body.initiatedAt !== undefined ? (body.initiatedAt ? new Date(body.initiatedAt) : undefined) : undefined,
        completedAt: body.completedAt !== undefined ? (body.completedAt ? new Date(body.completedAt) : null) : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyPayment update error:', error)
    return NextResponse.json(
      { error: 'Failed to update payment', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyPayment.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    await db.dairyPayment.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyPayment delete error:', error)
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}
