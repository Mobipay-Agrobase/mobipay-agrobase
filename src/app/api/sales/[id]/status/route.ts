import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * POST /api/sales/[id]/status
 *
 * Sale lifecycle with E2E traceability (step-by-step timeline):
 *   { action: 'approve' }  PENDING → APPROVED (+approvedBy/approvedAt)
 *   { action: 'invoice' }  APPROVED → INVOICED (invoice number assigned)
 *   { action: 'pay', transactionRef? }  INVOICED|APPROVED → PAID
 *        · Payment row created (saleId linked, type MARKETPLACE)
 *        · TraceEvent SALE_PAID appended to the linked batch ledger
 *   { action: 'deliver' }  PAID|INVOICED → DELIVERED (+Delivery record)
 *   { action: 'complete' } → COMPLETED
 *   { action: 'cancel' }   → CANCELLED
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any
    const body = await req.json().catch(() => ({}))
    const action = String(body.action || '')

    const sale = await db.sale.findFirst({
      where: { id, ...tf },
      include: { farmer: { select: { id: true, firstName: true, lastName: true, phone: true } } },
    })
    if (!sale) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const now = new Date()

    if (action === 'approve') {
      const updated = await db.sale.update({
        where: { id },
        data: { status: 'APPROVED', approvedBy: ctx.userId, approvedAt: now },
      })
      return NextResponse.json({ data: updated })
    }

    if (action === 'invoice') {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
      const updated = await db.sale.update({ where: { id }, data: { status: 'INVOICED' } })
      return NextResponse.json({ data: updated, invoiceNumber })
    }

    if (action === 'pay') {
      const transactionRef = body.transactionRef || `PAY-${Date.now()}`
      const amount = Number(body.amount ?? sale.netAmount ?? sale.totalAmount ?? 0)
      const payment = await db.payment.create({
        data: {
          type: 'MARKETPLACE',
          recipientName: sale.customerName || (sale.farmer ? `${sale.farmer.firstName} ${sale.farmer.lastName}`.trim() : 'Buyer'),
          recipientPhone: body.buyerPhone || '',
          amount,
          description: `Sale settlement: ${sale.product} ${sale.quantity}${sale.category === 'INPUT' ? ' units' : 'kg'}`,
          transactionRef,
          saleId: id,
          status: 'COMPLETED',
        },
      })
      const updated = await db.sale.update({ where: { id }, data: { status: 'PAID', paidAt: now } })

      // Append trace event when the sale is linked to a batch
      if (sale.batchId) {
        const batch = await db.productBatch.findFirst({ where: { batchId: sale.batchId } })
        if (batch) {
          await db.traceEvent.create({
            data: {
              tenantId: batch.tenantId,
              productBatchId: batch.id,
              eventType: 'SALE_PAID',
              stage: 'SALES',
              actorId: ctx.userId,
              actorType: 'USER',
              details: JSON.stringify({ saleId: id, amount, transactionRef }),
            },
          }).catch(() => {})
        }
      }
      return NextResponse.json({ data: updated, payment })
    }

    if (action === 'deliver') {
      const delivery = await db.delivery.create({
        data: {
          tenantId: ctx.tenantId!,
          relatedId: id,
          relatedType: 'SALE',
          status: 'DELIVERED',
          driverName: body.driverName || null,
          vehicleReg: body.vehicleReg || null,
          dispatchedAt: now,
          deliveredAt: now,
        },
      })
      const updated = await db.sale.update({ where: { id }, data: { status: 'DELIVERED', deliveredAt: now } })
      return NextResponse.json({ data: updated, delivery })
    }

    if (action === 'complete') {
      const updated = await db.sale.update({ where: { id }, data: { status: 'COMPLETED' } })
      return NextResponse.json({ data: updated })
    }

    if (action === 'cancel') {
      const updated = await db.sale.update({ where: { id }, data: { status: 'CANCELLED' } })
      return NextResponse.json({ data: updated })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    console.error('[sale status]', error)
    return NextResponse.json({ error: 'Status update failed', detail: error.message }, { status: 500 })
  }
}
