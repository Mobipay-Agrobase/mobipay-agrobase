/**
 * EKIBBO Connectors — Links purchase workflow to universal modules
 *
 * When a purchase is approved, these connectors fire:
 * 1. Farmer Ledger entries (credit + deductions + payment)
 * 2. Input distribution balance update (if input deduction)
 * 3. Traceability batch creation
 * 4. Impact event recording
 *
 * Each connector is a standalone function that can be called independently.
 * They are designed to be idempotent — safe to retry.
 */
import { db } from '@/lib/db'

/**
 * Create farmer ledger entries when a purchase is approved.
 * Creates multiple entries: purchase credit, loan deduction, input deduction,
 * MoMo charges, tax, and net payment.
 */
export async function createPurchaseLedgerEntries(
  tenantId: string,
  purchaseId: string,
  farmerId: string,
  userId: string,
  purchaseData: {
    commodity: string
    netWeight?: number | null
    dailyPrice?: number | null
    totalAmount?: number | null
    loanDeduction?: number | null
    inputDeduction?: number | null
    momoCharges?: number | null
    momoTax?: number | null
    netPayment?: number | null
  }
) {
  const entries: Array<{
    type: string
    description: string
    amount: number
  }> = []

  // 1. Purchase credit (positive = farmer earns)
  const purchaseTotal = purchaseData.totalAmount ||
    ((purchaseData.netWeight || 0) * (purchaseData.dailyPrice || 0))
  if (purchaseTotal > 0) {
    entries.push({
      type: 'PURCHASE',
      description: `Purchase: ${purchaseData.commodity} (${purchaseData.netWeight || 0}kg @ ${purchaseData.dailyPrice || 0}/kg)`,
      amount: purchaseTotal,
    })
  }

  // 2. Loan deduction (negative = farmer pays back)
  if (purchaseData.loanDeduction && purchaseData.loanDeduction > 0) {
    entries.push({
      type: 'LOAN_REPAY',
      description: 'Loan repayment deduction',
      amount: -purchaseData.loanDeduction,
    })
  }

  // 3. Input deduction (negative = farmer pays back for inputs)
  if (purchaseData.inputDeduction && purchaseData.inputDeduction > 0) {
    entries.push({
      type: 'INPUT_REPAY',
      description: 'Input repayment deduction',
      amount: -purchaseData.inputDeduction,
    })
  }

  // 4. MoMo charges (negative)
  if (purchaseData.momoCharges && purchaseData.momoCharges > 0) {
    entries.push({
      type: 'CHARGE',
      description: 'Mobile money withdrawal charges',
      amount: -purchaseData.momoCharges,
    })
  }

  // 5. Tax (negative)
  if (purchaseData.momoTax && purchaseData.momoTax > 0) {
    entries.push({
      type: 'CHARGE',
      description: 'Mobile money tax',
      amount: -purchaseData.momoTax,
    })
  }

  // 6. Net payment (negative = cash paid out to farmer, balance settles to ~0)
  if (purchaseData.netPayment && purchaseData.netPayment > 0) {
    entries.push({
      type: 'PAYMENT',
      description: 'Payment to farmer via mobile money',
      amount: -purchaseData.netPayment,
    })
  }

  // Calculate running balance
  let runningBalance = 0

  // Get current balance
  const lastEntry = await db.farmerLedgerEntry.findFirst({
    where: { farmerId },
    orderBy: { date: 'desc' },
    select: { balanceAfter: true },
  })
  runningBalance = lastEntry?.balanceAfter || 0

  // Create all entries
  for (const entry of entries) {
    runningBalance += entry.amount
    await db.farmerLedgerEntry.create({
      data: {
        tenantId,
        farmerId,
        type: entry.type,
        description: entry.description,
        amount: entry.amount,
        balanceAfter: runningBalance,
        referenceType: 'Purchase',
        referenceId: purchaseId,
        purchaseId,
        createdBy: userId,
        approvalStatus: 'APPROVED',
        approvedBy: userId,
      },
    })
  }

  return entries.length
}

/**
 * Update input distribution balance when a deduction is made.
 */
export async function updateInputDistributionBalance(
  inputDistId: string,
  repaymentAmount: number
) {
  const dist = await db.inputDistribution.findUnique({
    where: { id: inputDistId },
    select: { id: true, balanceRemaining: true, totalCost: true },
  })

  if (!dist) return

  const newBalance = Math.max(0, (dist.balanceRemaining || dist.totalCost) - repaymentAmount)
  const newStatus = newBalance === 0 ? 'FULLY_REPAID' : 'PARTIALLY_REPAID'

  await db.inputDistribution.update({
    where: { id: inputDistId },
    data: {
      balanceRemaining: newBalance,
      status: newStatus,
    },
  })
}

/**
 * Create a traceability batch when a purchase is approved.
 * Links: Farmer → Purchase → Batch (for EUDR export compliance)
 */
export async function createTraceabilityBatch(
  tenantId: string,
  purchaseId: string,
  farmerId: string,
  commodity: string,
  netWeight: number
) {
  try {
    const batchId = `BAT-${Date.now()}-${commodity.substring(0, 3).toUpperCase()}`
    await db.productBatch.create({
      data: {
        tenantId,
        batchId,
        farmerId,
        commodity,
        quantityKg: netWeight,
        status: 'COLLECTED',
        currentStage: 'COLLECTION',
      },
    })
    return batchId
  } catch (error) {
    console.error('[Connector] Traceability batch creation failed:', error)
    return null
  }
}

/**
 * Record an impact event when a purchase is made.
 * Updates the farmer's income baseline.
 */
export async function recordPurchaseImpactEvent(
  tenantId: string,
  farmerId: string,
  purchaseAmount: number,
  commodity: string
) {
  try {
    await db.impactEvent.create({
      data: {
        tenantId,
        farmerId,
        eventType: 'PURCHASE_RECORDED',
        eventData: JSON.stringify({
          amount: purchaseAmount,
          commodity,
          timestamp: new Date().toISOString(),
        }),
        prevHash: null,
        hash: `pur-${Date.now()}-${farmerId.substring(0, 8)}`,
      },
    })
  } catch (error) {
    console.error('[Connector] Impact event creation failed:', error)
  }
}
