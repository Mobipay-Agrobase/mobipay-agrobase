import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyPaymentBatch.findFirst({
      where: { id, ...tf },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!item) return NextResponse.json({ error: 'Payment batch not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyPaymentBatch detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch payment batch' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyPaymentBatch.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Payment batch not found' }, { status: 404 })
    const body = await req.json()

    const updated = await db.dairyPaymentBatch.update({
      where: { id },
      data: {
        batchNo: body.batchNo !== undefined ? body.batchNo : undefined,
        batchDate: body.batchDate !== undefined ? (body.batchDate ? new Date(body.batchDate) : undefined) : undefined,
        totalAmount: body.totalAmount !== undefined ? (body.totalAmount ? parseFloat(body.totalAmount) : undefined) : undefined,
        totalPayments: body.totalPayments !== undefined ? (body.totalPayments ? parseInt(body.totalPayments) : undefined) : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        channel: body.channel !== undefined ? body.channel : undefined,
        status: body.status !== undefined ? body.status : undefined,
        submittedBy: body.submittedBy !== undefined ? body.submittedBy || null : undefined,
        submittedAt: body.submittedAt !== undefined ? (body.submittedAt ? new Date(body.submittedAt) : null) : undefined,
        approvedBy: body.approvedBy !== undefined ? body.approvedBy || null : undefined,
        approvedAt: body.approvedAt !== undefined ? (body.approvedAt ? new Date(body.approvedAt) : null) : undefined,
        processedAt: body.processedAt !== undefined ? (body.processedAt ? new Date(body.processedAt) : null) : undefined,
        completedAt: body.completedAt !== undefined ? (body.completedAt ? new Date(body.completedAt) : null) : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyPaymentBatch update error:', error)
    return NextResponse.json(
      { error: 'Failed to update payment batch', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyPaymentBatch.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Payment batch not found' }, { status: 404 })
    await db.dairyPaymentBatch.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyPaymentBatch delete error:', error)
    return NextResponse.json({ error: 'Failed to delete payment batch' }, { status: 500 })
  }
}
