import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { createPurchaseLedgerEntries, updateInputDistributionBalance, createTraceabilityBatch, recordPurchaseImpactEvent } from '@/lib/ekbibo/connectors'

export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const commodity = searchParams.get('commodity') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (commodity) where.commodity = commodity

    // Filter through farmer tenantId OR purchase tenantId (EKIBBO enhancement)
    if (!ctx.isSuperAdmin) {
      const validFarmerIds = await db.farmerProfile.findMany({
        where: { tenantId: { in: ctx.tenantScope as string[] } },
        select: { id: true },
      })
      where.OR = [
        { farmerId: { in: validFarmerIds.map(f => f.id) } },
        { tenantId: { in: ctx.tenantScope as string[] } },
      ]
    }

    const [data, total] = await Promise.all([
      db.purchase.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.purchase.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    // Check if this is an EKIBBO enhanced purchase (has moistureReading or dailyPrice)
    const isEnhanced = body.moistureReading !== undefined || body.dailyPrice !== undefined

    // Auto-calculate EKIBBO fields if provided
    let netWeight: number | null = null
    let totalAmount: number | null = null
    let netPayment: number | null = null

    if (isEnhanced) {
      const totalWeight = parseFloat(body.quantity) || 0
      const qualityDeduction = parseFloat(body.qualityDeduction) || 0
      netWeight = totalWeight - qualityDeduction

      const dailyPrice = parseFloat(body.dailyPrice) || 0
      totalAmount = netWeight * dailyPrice

      const loanDeduction = parseFloat(body.loanDeduction) || 0
      const inputDeduction = parseFloat(body.inputDeduction) || 0
      const momoCharges = parseFloat(body.momoCharges) || 0
      const momoTax = parseFloat(body.momoTax) || 0

      netPayment = totalAmount - loanDeduction - inputDeduction - momoCharges - momoTax
    }

    const purchase = await db.purchase.create({
      data: {
        groupId: body.groupId || null,
        farmerId: body.farmerId || null,
        commodity: body.commodity,
        variety: body.variety || null,
        quantity: body.quantity,
        unitPrice: body.unitPrice ?? null,
        totalAmount: totalAmount ?? body.totalAmount ?? null,
        status: body.status || 'PENDING',
        initiatedBy: ctx.userId,
        reviewedBy: body.reviewedBy || null,
        approvedBy: body.approvedBy || null,

        // EKIBBO enhanced fields (nullable — no impact on non-EKIBBO tenants)
        tenantId: ctx.tenantId,
        moistureReading: body.moistureReading ? parseFloat(body.moistureReading) : null,
        moisturePhotoUrl: body.moisturePhotoUrl || null,
        defectCount: body.defectCount ? parseInt(body.defectCount) : null,
        qualityDeduction: body.qualityDeduction ? parseFloat(body.qualityDeduction) : null,
        netWeight,
        dailyPrice: body.dailyPrice ? parseFloat(body.dailyPrice) : null,
        loanDeduction: body.loanDeduction ? parseFloat(body.loanDeduction) : null,
        inputDeduction: body.inputDeduction ? parseFloat(body.inputDeduction) : null,
        momoCharges: body.momoCharges ? parseFloat(body.momoCharges) : null,
        momoTax: body.momoTax ? parseFloat(body.momoTax) : null,
        netPayment,
        loanId: body.loanId || null,
        inputDistId: body.inputDistId || null,
        approvalStatus: body.approvalStatus || 'SUBMITTED',
      },
      include: { farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true, phone: true } } },
    })

    // ─── Vendor Financing Fee Hook ───────────────────────────────────
    // If this tenant has an active BillingAgreement, calculate and record
    // the transaction fee. This is what powers the billing engine.
    // Wrapped in try/catch — fee collection is non-critical; the purchase
    // should still succeed even if the fee hook fails.
    try {
      const { recordTransactionFee } = await import('@/lib/vendor-financing/engine')
      await recordTransactionFee({
        tenantId: ctx.tenantId,
        transactionType: 'PURCHASE',
        transactionId: purchase.id,
        transactionAmount: Number(totalAmount || purchase.totalAmount || 0),
        transactionQuantity: parseFloat(body.quantity) || undefined,
        momoGatewayFee: Number(body.momoCharges || 0) + Number(body.momoTax || 0),
      })
    } catch (feeError) {
      console.error('[purchases] fee hook error:', feeError)
    }
    // ─── End Fee Hook ────────────────────────────────────────────────

    return NextResponse.json({ data: purchase }, { status: 201 })
  } catch (error: any) {
    console.error('Purchase create error:', error)
    return NextResponse.json({ error: 'Failed to create purchase', detail: error.message }, { status: 500 })
  }
}

/**
 * PATCH — Update purchase status (approve/reject) and trigger connectors.
 * When status changes to APPROVED:
 *   1. Create farmer ledger entries
 *   2. Update input distribution balance (if input deduction)
 *   3. Create traceability batch
 *   4. Record impact event
 */
export async function PATCH(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()
    const { id, status, approvalStatus } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (status) updateData.status = status
    if (approvalStatus) {
      updateData.approvalStatus = approvalStatus
      if (approvalStatus === 'APPROVED') {
        updateData.approvedById = ctx.userId
        updateData.approvedAt = new Date()
        updateData.status = 'APPROVED'
      }
    }

    const updated = await db.purchase.update({
      where: { id },
      data: updateData,
      include: { farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true, phone: true } } },
    })

    // If approved, trigger connectors
    if (approvalStatus === 'APPROVED' && updated.farmerId) {
      try {
        // 1. Create ledger entries
        await createPurchaseLedgerEntries(
          ctx.tenantId,
          id,
          updated.farmerId,
          ctx.userId,
          {
            commodity: updated.commodity,
            netWeight: updated.netWeight,
            dailyPrice: updated.dailyPrice,
            totalAmount: updated.totalAmount,
            loanDeduction: updated.loanDeduction,
            inputDeduction: updated.inputDeduction,
            momoCharges: updated.momoCharges,
            momoTax: updated.momoTax,
            netPayment: updated.netPayment,
          }
        )

        // 2. Update input distribution balance
        if (updated.inputDistId && updated.inputDeduction) {
          await updateInputDistributionBalance(updated.inputDistId, updated.inputDeduction)
        }

        // 3. Create traceability batch
        if (updated.netWeight && updated.netWeight > 0) {
          await createTraceabilityBatch(
            ctx.tenantId,
            id,
            updated.farmerId,
            updated.commodity,
            updated.netWeight
          )
        }

        // 4. Record impact event
        if (updated.totalAmount && updated.totalAmount > 0) {
          await recordPurchaseImpactEvent(
            ctx.tenantId,
            updated.farmerId,
            updated.totalAmount,
            updated.commodity
          )
        }
      } catch (connectorError) {
        // Log but don't fail the approval — ledger can be reconciled later
        console.error('[Purchase Approval] Connector error:', connectorError)
      }
    }

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    console.error('Purchase update error:', error)
    return NextResponse.json({ error: 'Failed to update purchase' }, { status: 500 })
  }
}
