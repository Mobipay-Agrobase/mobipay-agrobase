import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { createPurchaseLedgerEntries, createTraceabilityBatch } from '@/lib/ekbibo/connectors'

/**
 * POST /api/purchases/[id]/status
 *
 * Purchase lifecycle with full E2E traceability:
 *   { action: 'submit' }   DRAFT → SUBMITTED (pending review)
 *   { action: 'approve' }  SUBMITTED → APPROVED
 *                          · creates farmer ledger entries
 *                          · creates traceability ProductBatch (COLLECTED,
 *                            sourcePurchaseId linked)
 *   { action: 'reject', reason? }  → REJECTED
 *   { action: 'pay', paymentMethod?, transactionRef? }  APPROVED → PAID
 *                          · records a Payment row (purchaseId linked) so the
 *                            payment shows in Payments + E2E trace chain
 *                          · writes paymentRef on the purchase
 *
 * Tenant-scoped; approvals limited to roles with purchases:approve.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any
    const body = await req.json().catch(() => ({}))
    const action = String(body.action || '')

    const purchase = await db.purchase.findFirst({
      where: { id, farmer: { ...tf } },
      include: { farmer: { select: { id: true, firstName: true, lastName: true, phone: true } } },
    })
    if (!purchase) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // RBAC enforcement (mirrors the documented permission matrix):
    // approve / reject / pay (farmer payment) require 'purchases:approve'.
    // Without this, draft-only roles (EKB_FIN_ASSISTANT) and submit-only
    // roles (EKB_EXTENSION) could approve purchases and record farmer
    // payments — live-verified RBAC gap. 'submit' stays open to creators.
    if (action === 'approve' || action === 'reject' || action === 'pay') {
      if (!hasPermission(ctx.role || '', 'purchases:approve')) {
        return NextResponse.json(
          { error: 'Only roles with purchase approval rights can approve, reject, or record farmer payments' },
          { status: 403 },
        )
      }
    }

    const now = new Date()

    if (action === 'submit') {
      const updated = await db.purchase.update({
        where: { id },
        data: { approvalStatus: 'SUBMITTED', status: 'PENDING' },
      })
      return NextResponse.json({ data: updated })
    }

    if (action === 'approve') {
      if (purchase.approvalStatus === 'APPROVED') {
        return NextResponse.json({ error: 'Already approved' }, { status: 400 })
      }
      const updated = await db.purchase.update({
        where: { id },
        data: {
          approvalStatus: 'APPROVED',
          status: 'APPROVED',
          approvedById: ctx.userId,
          approvedAt: now,
        },
      })

      // Ledger + traceability batch (non-fatal on error — reconcilable)
      try {
        await createPurchaseLedgerEntries(ctx.tenantId!, id, purchase.farmerId || '', ctx.userId, {
          commodity: purchase.commodity,
          netWeight: purchase.netWeight,
          dailyPrice: purchase.dailyPrice,
          totalAmount: purchase.totalAmount,
          loanDeduction: purchase.loanDeduction,
          inputDeduction: purchase.inputDeduction,
          momoCharges: purchase.momoCharges,
          momoTax: purchase.momoTax,
          netPayment: purchase.netPayment,
        })
        if ((purchase.netWeight ?? 0) > 0 && purchase.farmerId) {
          await db.productBatch.create({
            data: {
              tenantId: ctx.tenantId!,
              batchId: `BAT-${Date.now()}-${purchase.commodity.substring(0, 3).toUpperCase()}`,
              farmerId: purchase.farmerId,
              commodity: purchase.commodity,
              variety: purchase.variety,
              quantityKg: purchase.netWeight!,
              status: 'COLLECTED',
              currentStage: 'COLLECTION',
              sourcePurchaseId: id,
            },
          })
        }
      } catch (e) {
        console.error('[purchase approve] connector error:', e)
      }
      return NextResponse.json({ data: updated })
    }

    if (action === 'reject') {
      const updated = await db.purchase.update({
        where: { id },
        data: { approvalStatus: 'REJECTED', status: 'REJECTED' },
      })
      return NextResponse.json({ data: updated })
    }

    if (action === 'pay') {
      if (purchase.approvalStatus !== 'APPROVED') {
        return NextResponse.json({ error: 'Purchase must be approved before payment' }, { status: 400 })
      }
      const paymentRef = body.transactionRef || `PAY-${Date.now()}`
      const amount = Number(body.amount ?? purchase.netPayment ?? purchase.totalAmount ?? 0)

      // Link to the tenant's active PaymentAccount so the farmer payment is
      // visible in the tenant Payments module (matches /api/payments GET).
      let paymentAccountId: string | null = null
      if (ctx.tenantId) {
        const account = await db.paymentAccount.findFirst({
          where: { tenantId: ctx.tenantId, isActive: true },
          select: { id: true },
        }).catch(() => null)
        paymentAccountId = account?.id ?? null
      }

      const payment = await db.payment.create({
        data: {
          type: 'BULK_PURCHASE',
          recipientName: purchase.farmer
            ? `${purchase.farmer.firstName} ${purchase.farmer.lastName}`.trim()
            : 'Farmer',
          recipientPhone: purchase.farmer?.phone || '',
          amount,
          description: `Purchase settlement: ${purchase.commodity} ${(purchase.netWeight ?? purchase.quantity)}kg`,
          transactionRef: paymentRef,
          purchaseId: id,
          paymentAccountId,
          status: 'COMPLETED',
        },
      })

      const updated = await db.purchase.update({
        where: { id },
        data: { status: 'PAID', paymentRef },
      })
      return NextResponse.json({ data: updated, payment })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    console.error('[purchase status]', error)
    return NextResponse.json({ error: 'Status update failed', detail: error.message }, { status: 500 })
  }
}
