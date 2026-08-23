import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/e2e-trace?purchaseId=xxx | saleId=xxx | batchId=BAT-...
 *
 * End-to-end traceability chain (Ekibbo requirement):
 *   Purchase (procurement from farmer)
 *     → ProductBatch (COLLECTED, trace events)
 *       → Sale(s) (sold to buyer)
 *         → Payment(s) (settlement, both purchase-side + sale-side)
 *         → Delivery (logistics proof)
 *         → Invoice (computed commercial invoice from the sale record)
 *
 * The chain is assembled from explicit links added for e2e traceability:
 *   ProductBatch.sourcePurchaseId, Sale.batchId, Payment.purchaseId/saleId,
 *   Delivery.relatedId/relatedType. Tenant-scoped throughout.
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any
    const { searchParams } = new URL(req.url)
    const purchaseId = searchParams.get('purchaseId')
    const saleId = searchParams.get('saleId')
    const batchCode = searchParams.get('batchId')

    if (!purchaseId && !saleId && !batchCode) {
      return NextResponse.json({ error: 'purchaseId, saleId or batchId is required' }, { status: 400 })
    }

    // ── Resolve the anchor record (tenant-scoped) ────────────────────────
    let purchase: any = null
    let sale: any = null
    let batch: any = null

    if (purchaseId) {
      purchase = await db.purchase.findFirst({
        where: { id: purchaseId, farmer: { ...tf } },
        include: { farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true, phone: true } } },
      })
      if (!purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
      batch = await db.productBatch.findFirst({ where: { sourcePurchaseId: purchaseId } })
    } else if (saleId) {
      sale = await db.sale.findFirst({
        where: { id: saleId, ...tf },
        include: { farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true } } },
      })
      if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
      if (sale.batchId) {
        batch = await db.productBatch.findFirst({ where: { batchId: sale.batchId } })
        if (batch?.sourcePurchaseId) {
          purchase = await db.purchase.findFirst({
            where: { id: batch.sourcePurchaseId, ...tf },
            include: { farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true, phone: true } } },
          })
        }
      }
    } else if (batchCode) {
      batch = await db.productBatch.findFirst({ where: { batchId: batchCode, ...tf } })
      if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
      if (batch.sourcePurchaseId) {
        purchase = await db.purchase.findFirst({
          where: { id: batch.sourcePurchaseId, ...tf },
          include: { farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true, phone: true } } },
        })
      }
    }

    // ── Batch children: events + sales ───────────────────────────────────
    let events: any[] = []
    let sales: any[] = []
    if (batch) {
      events = await db.traceEvent.findMany({
        where: { productBatchId: batch.id },
        orderBy: { timestamp: 'asc' },
        take: 100,
      })
      sales = await db.sale.findMany({
        where: { batchId: batch.batchId, ...tf },
        orderBy: { createdAt: 'asc' },
      })
    }

    // ── Payments: purchase-side + sale-side ──────────────────────────────
    const purchasePayments = purchase
      ? await db.payment.findMany({ where: { purchaseId: purchase.id }, orderBy: { createdAt: 'asc' } })
      : []
    const saleIds = sales.map(s => s.id)
    const salePayments = await db.payment.findMany({
      where: { saleId: { in: saleIds.length ? saleIds : ['__none__'] } },
      orderBy: { createdAt: 'asc' },
    })

    // ── Deliveries for the sales ─────────────────────────────────────────
    const deliveries = await db.delivery.findMany({
      where: {
        ...tf,
        OR: [
          ...(saleIds.length ? saleIds.map(sid => ({ relatedId: sid, relatedType: 'SALE' as const })) : []),
          ...(purchase ? [{ relatedId: purchase.id }] : []),
          ...(batch ? [{ relatedId: batch.batchId }] : []),
        ],
      },
      orderBy: { createdAt: 'asc' },
    })

    // ── Inventory position for the batch ─────────────────────────────────
    let inventory: any = null
    if (batch) {
      const soldKg = sales.reduce((s, x) => s + (parseFloat(x.quantity) || 0) * (x.category === 'INPUT' ? 1 : 1), 0)
      inventory = {
        collectedKg: batch.quantityKg,
        soldKg,
        remainingKg: Math.max(0, batch.quantityKg - soldKg),
      }
    }

    // ── Computed invoices (one per sale — commercial invoice view) ───────
    const invoices = sales.map((s, i) => {
      const qty = parseFloat(s.quantity) || 0
      const unitPrice = s.unitPrice || 0
      const subtotal = s.totalAmount ?? qty * unitPrice
      const charges = s.charges || 0
      const tax = s.taxAmount || 0
      return {
        invoiceNumber: `INV-${new Date(s.createdAt).getFullYear()}-${s.id.slice(-6).toUpperCase()}`,
        saleId: s.id,
        customer: s.customerName || 'Buyer',
        product: s.product,
        quantity: qty,
        unitPrice,
        subtotal,
        charges,
        tax,
        total: subtotal - charges - tax,
        currency: 'UGX',
        status: s.status,
        issuedAt: s.createdAt,
        dueDate: new Date(new Date(s.createdAt).getTime() + 30 * 24 * 3600 * 1000),
      }
    })

    return NextResponse.json({
      purchase,
      batch,
      events,
      sales,
      purchasePayments,
      salePayments,
      deliveries,
      inventory,
      invoices,
    })
  } catch (error: any) {
    console.error('[e2e-trace]', error)
    return NextResponse.json({ error: 'Trace lookup failed', detail: error.message }, { status: 500 })
  }
}
