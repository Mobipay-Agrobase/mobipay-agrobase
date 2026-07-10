/**
 * Vendor Financing Engine
 * ─────────────────────────
 * The core billing engine. Handles:
 *   1. Fee calculation on every transaction (recordTransactionFee)
 *   2. Fee reversal when a transaction is cancelled (reverseTransactionFee)
 *   3. Recovery status tracking (getRecoveryStatus)
 *   4. Monthly reconciliation (runMonthlyReconciliation)
 *   5. Recovery completion detection (checkRecoveryCompletion)
 *   6. Audit-logged edits to upfrontInvestment and feeRate
 *
 * File: src/lib/vendor-financing/engine.ts
 */

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────

interface RecordFeeParams {
  tenantId: string
  transactionType: 'PURCHASE' | 'SALE' | 'PAYOUT'
  transactionId: string
  transactionAmount: number
  transactionQuantity?: number  // kg — required if feeType is PER_KG
  momoGatewayFee?: number       // if known at creation time
}

interface RecoveryStatus {
  agreement: any | null
  investmentRemaining: number
  recoveredPercent: number
  projectedRecoveryMonth: string | null  // ISO month "YYYY-MM", or null if can't project
  thisMonthFees: number
  thisMonthCost: number
  thisMonthSurplus: number
  thisMonthTransactionCount: number
}

// ─── 1. Record Transaction Fee ───────────────────────────────────────────
// Called after every purchase/sale/payout is created.

export async function recordTransactionFee(params: RecordFeeParams): Promise<{
  feeAmount: number
  mobipayFee: number
  allocatedToRecovery: number
  allocatedToProfit: number
  agreementStatus: string
} | null> {
  const { tenantId, transactionType, transactionId, transactionAmount, transactionQuantity, momoGatewayFee = 0 } = params

  const agreement = await db.billingAgreement.findFirst({
    where: { tenantId, status: 'ACTIVE' },
  })

  if (!agreement) return null

  // Check if this transaction type is in scope
  if (agreement.feeAppliesTo && agreement.feeAppliesTo !== 'ALL') {
    const appliesTo = agreement.feeAppliesTo
    if (appliesTo === 'PURCHASES' && transactionType !== 'PURCHASE') return null
    if (appliesTo === 'SALES' && transactionType !== 'SALE') return null
    if (appliesTo === 'PAYOUTS' && transactionType !== 'PAYOUT') return null
  }

  // Calculate fee based on feeType
  const feeRate = Number(agreement.feeRate) || 0
  let feeAmount = 0

  switch (agreement.feeType) {
    case 'PERCENTAGE':
      feeAmount = transactionAmount * feeRate
      break
    case 'PER_KG':
      if (!transactionQuantity) {
        console.warn(`[VendorFinancing] PER_KG fee type but no quantity provided for txn ${transactionId}`)
        return null
      }
      feeAmount = transactionQuantity * feeRate
      break
    case 'FLAT_PER_TXN':
      feeAmount = feeRate
      break
    case 'NONE':
    case null:
      return null
    default:
      return null
  }

  // Apply minimum fee per transaction
  if (agreement.feeMinPerTxn) {
    feeAmount = Math.max(feeAmount, Number(agreement.feeMinPerTxn))
  }

  // Split fee: MoMo gateway pass-through vs MobiPay's portion
  const mobipayFee = Math.max(0, feeAmount - momoGatewayFee)

  // Allocation
  let allocatedToRecovery = 0
  let allocatedToProfit = 0

  if (agreement.billingModel === 'VENDOR_FINANCING' && agreement.status === 'ACTIVE') {
    allocatedToRecovery = mobipayFee
  } else {
    allocatedToProfit = mobipayFee
  }

  // Create the ledger entry
  await db.transactionFeeLedger.create({
    data: {
      tenantId,
      agreementId: agreement.id,
      transactionType,
      transactionId,
      transactionAmount: new Prisma.Decimal(transactionAmount),
      transactionQuantity: transactionQuantity ? new Prisma.Decimal(transactionQuantity) : null,
      feeType: agreement.feeType || 'PERCENTAGE',
      feeRate: new Prisma.Decimal(feeRate),
      feeAmount: new Prisma.Decimal(roundTo(feeAmount, 2)),
      momoGatewayFee: new Prisma.Decimal(roundTo(momoGatewayFee, 2)),
      mobipayFee: new Prisma.Decimal(roundTo(mobipayFee, 2)),
      allocatedToRecovery: new Prisma.Decimal(roundTo(allocatedToRecovery, 2)),
      allocatedToProfit: new Prisma.Decimal(roundTo(allocatedToProfit, 2)),
    },
  })

  // Update agreement running totals
  await db.billingAgreement.update({
    where: { id: agreement.id },
    data: {
      totalFeesCollected: { increment: new Prisma.Decimal(roundTo(feeAmount, 2)) },
      recoveredAmount: { increment: new Prisma.Decimal(roundTo(allocatedToRecovery, 2)) },
    },
  })

  // Check if recovery is complete
  if (agreement.billingModel === 'VENDOR_FINANCING' && agreement.status === 'ACTIVE') {
    await checkRecoveryCompletion(agreement.id)
  }

  return {
    feeAmount: roundTo(feeAmount, 2),
    mobipayFee: roundTo(mobipayFee, 2),
    allocatedToRecovery: roundTo(allocatedToRecovery, 2),
    allocatedToProfit: roundTo(allocatedToProfit, 2),
    agreementStatus: agreement.status,
  }
}

// ─── 2. Reverse Transaction Fee ──────────────────────────────────────────

export async function reverseTransactionFee(originalLedgerId: string, reason?: string): Promise<void> {
  const original = await db.transactionFeeLedger.findUnique({
    where: { id: originalLedgerId },
  })

  if (!original) throw new Error(`Ledger entry ${originalLedgerId} not found`)
  if (original.reversed) throw new Error(`Ledger entry ${originalLedgerId} already reversed`)

  await db.transactionFeeLedger.update({
    where: { id: originalLedgerId },
    data: { reversed: true, reversedAt: new Date() },
  })

  await db.transactionFeeLedger.create({
    data: {
      tenantId: original.tenantId,
      agreementId: original.agreementId,
      transactionType: original.transactionType,
      transactionId: original.transactionId,
      transactionAmount: new Prisma.Decimal(-Number(original.transactionAmount)),
      transactionQuantity: original.transactionQuantity ? new Prisma.Decimal(-Number(original.transactionQuantity)) : null,
      feeType: original.feeType,
      feeRate: original.feeRate,
      feeAmount: new Prisma.Decimal(-Number(original.feeAmount)),
      momoGatewayFee: new Prisma.Decimal(-Number(original.momoGatewayFee)),
      mobipayFee: new Prisma.Decimal(-Number(original.mobipayFee)),
      allocatedToRecovery: new Prisma.Decimal(-Number(original.allocatedToRecovery)),
      allocatedToProfit: new Prisma.Decimal(-Number(original.allocatedToProfit)),
      reversalOfId: originalLedgerId,
    },
  })

  await db.billingAgreement.update({
    where: { id: original.agreementId },
    data: {
      totalFeesCollected: { decrement: new Prisma.Decimal(Number(original.feeAmount)) },
      recoveredAmount: { decrement: new Prisma.Decimal(Number(original.allocatedToRecovery)) },
    },
  })
}

// ─── 3. Get Recovery Status ──────────────────────────────────────────────

export async function getRecoveryStatus(tenantId: string): Promise<RecoveryStatus> {
  const agreement = await db.billingAgreement.findFirst({
    where: { tenantId, status: { in: ['ACTIVE', 'RECOVERED'] } },
    orderBy: { createdAt: 'desc' },
  })

  if (!agreement) {
    return {
      agreement: null,
      investmentRemaining: 0,
      recoveredPercent: 0,
      projectedRecoveryMonth: null,
      thisMonthFees: 0,
      thisMonthCost: 0,
      thisMonthSurplus: 0,
      thisMonthTransactionCount: 0,
    }
  }

  const investment = Number(agreement.upfrontInvestment) || 0
  const recovered = Number(agreement.recoveredAmount) || 0
  const investmentRemaining = Math.max(0, investment - recovered)
  const recoveredPercent = investment > 0 ? Math.min(100, (recovered / investment) * 100) : 0

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const thisMonthLedger = await db.transactionFeeLedger.findMany({
    where: {
      tenantId,
      agreementId: agreement.id,
      recordedAt: { gte: monthStart, lt: monthEnd },
      reversed: false,
    },
  })

  const thisMonthFees = thisMonthLedger.reduce((sum, l) => sum + Number(l.mobipayFee), 0)
  const thisMonthCost = Number(agreement.recurringMonthlyCost) || 0
  const thisMonthSurplus = thisMonthFees - thisMonthCost
  const thisMonthTransactionCount = thisMonthLedger.length

  let projectedRecoveryMonth: string | null = null
  if (agreement.billingModel === 'VENDOR_FINANCING' && agreement.status === 'ACTIVE' && thisMonthSurplus > 0) {
    const monthsRemaining = Math.ceil(investmentRemaining / thisMonthSurplus)
    const projected = new Date(now.getFullYear(), now.getMonth() + monthsRemaining, 1)
    projectedRecoveryMonth = `${projected.getFullYear()}-${String(projected.getMonth() + 1).padStart(2, '0')}`
  }

  return {
    agreement,
    investmentRemaining,
    recoveredPercent,
    projectedRecoveryMonth,
    thisMonthFees,
    thisMonthCost,
    thisMonthSurplus,
    thisMonthTransactionCount,
  }
}

// ─── 4. Run Monthly Reconciliation ───────────────────────────────────────

export async function runMonthlyReconciliation(tenantId: string, period: string): Promise<any> {
  const [year, month] = period.split('-').map(Number)
  const periodStart = new Date(year, month - 1, 1)
  const periodEnd = new Date(year, month, 1)

  const agreement = await db.billingAgreement.findFirst({
    where: { tenantId, status: { in: ['ACTIVE', 'RECOVERED'] } },
  })

  if (!agreement) throw new Error(`No active agreement for tenant ${tenantId}`)

  const existing = await db.monthlyReconciliation.findUnique({
    where: { tenantId_period: { tenantId, period } },
  })

  if (existing && existing.status === 'FINALIZED') {
    return existing
  }

  const ledgerEntries = await db.transactionFeeLedger.findMany({
    where: {
      tenantId,
      agreementId: agreement.id,
      recordedAt: { gte: periodStart, lt: periodEnd },
    },
  })

  const activeEntries = ledgerEntries.filter(l => !l.reversed)

  const transactionCount = activeEntries.length
  const grossVolume = activeEntries.reduce((sum, l) => sum + Number(l.transactionAmount), 0)
  const totalFeesCollected = activeEntries.reduce((sum, l) => sum + Number(l.feeAmount), 0)
  const momoGatewayFees = activeEntries.reduce((sum, l) => sum + Number(l.momoGatewayFee), 0)
  const mobipayFees = activeEntries.reduce((sum, l) => sum + Number(l.mobipayFee), 0)

  const recurringCostIncurred = Number(agreement.recurringMonthlyCost) || 0
  const surplusApplied = mobipayFees - recurringCostIncurred

  const investmentBefore = Math.max(0, Number(agreement.upfrontInvestment) - Number(agreement.recoveredAmount) + surplusApplied)
  const investmentAfter = Math.max(0, investmentBefore - Math.max(0, surplusApplied))
  const recoveredThisMonth = surplusApplied > 0 ? surplusApplied : 0

  const reconciliation = await db.monthlyReconciliation.upsert({
    where: { tenantId_period: { tenantId, period } },
    create: {
      tenantId,
      agreementId: agreement.id,
      period,
      periodStart,
      periodEnd,
      transactionCount,
      grossVolume: new Prisma.Decimal(grossVolume),
      totalFeesCollected: new Prisma.Decimal(totalFeesCollected),
      momoGatewayFees: new Prisma.Decimal(momoGatewayFees),
      mobipayFees: new Prisma.Decimal(mobipayFees),
      costTrackingMode: agreement.costTrackingMode,
      recurringCostIncurred: new Prisma.Decimal(recurringCostIncurred),
      surplusApplied: new Prisma.Decimal(surplusApplied),
      investmentBefore: agreement.billingModel === 'VENDOR_FINANCING' ? new Prisma.Decimal(investmentBefore) : null,
      investmentAfter: agreement.billingModel === 'VENDOR_FINANCING' ? new Prisma.Decimal(investmentAfter) : null,
      recoveredThisMonth: agreement.billingModel === 'VENDOR_FINANCING' ? new Prisma.Decimal(recoveredThisMonth) : null,
      status: 'FINALIZED',
      finalizedAt: new Date(),
    },
    update: {
      transactionCount,
      grossVolume: new Prisma.Decimal(grossVolume),
      totalFeesCollected: new Prisma.Decimal(totalFeesCollected),
      momoGatewayFees: new Prisma.Decimal(momoGatewayFees),
      mobipayFees: new Prisma.Decimal(mobipayFees),
      recurringCostIncurred: new Prisma.Decimal(recurringCostIncurred),
      surplusApplied: new Prisma.Decimal(surplusApplied),
      investmentBefore: agreement.billingModel === 'VENDOR_FINANCING' ? new Prisma.Decimal(investmentBefore) : null,
      investmentAfter: agreement.billingModel === 'VENDOR_FINANCING' ? new Prisma.Decimal(investmentAfter) : null,
      recoveredThisMonth: agreement.billingModel === 'VENDOR_FINANCING' ? new Prisma.Decimal(recoveredThisMonth) : null,
      status: 'FINALIZED',
      finalizedAt: new Date(),
    },
  })

  return reconciliation
}

// ─── 5. Check Recovery Completion ────────────────────────────────────────

export async function checkRecoveryCompletion(agreementId: string): Promise<boolean> {
  const agreement = await db.billingAgreement.findUnique({
    where: { id: agreementId },
  })

  if (!agreement) return false
  if (agreement.billingModel !== 'VENDOR_FINANCING') return false
  if (agreement.status !== 'ACTIVE') return false

  const investment = Number(agreement.upfrontInvestment) || 0
  const recovered = Number(agreement.recoveredAmount) || 0

  if (recovered >= investment && investment > 0) {
    await db.billingAgreement.update({
      where: { id: agreementId },
      data: {
        status: 'RECOVERED',
        recoveredAt: new Date(),
      },
    })
    console.log(`[VendorFinancing] Agreement ${agreementId} fully recovered!`)
    return true
  }

  return false
}

// ─── 6. Edit Upfront Investment (with audit log) ─────────────────────────

export async function updateUpfrontInvestment(params: {
  agreementId: string
  newAmount: number
  changedByUserId: string
  reason: string
}): Promise<void> {
  const { agreementId, newAmount, changedByUserId, reason } = params

  const agreement = await db.billingAgreement.findUnique({
    where: { id: agreementId },
  })
  if (!agreement) throw new Error(`Agreement ${agreementId} not found`)

  const previousAmount = Number(agreement.upfrontInvestment) || 0
  if (previousAmount === newAmount) return

  await db.billingAgreement.update({
    where: { id: agreementId },
    data: { upfrontInvestment: new Prisma.Decimal(newAmount) },
  })

  await db.billingInvestmentChange.create({
    data: {
      agreementId,
      changedByUserId,
      previousAmount: new Prisma.Decimal(previousAmount),
      newAmount: new Prisma.Decimal(newAmount),
      reason,
    },
  })

  await checkRecoveryCompletion(agreementId)
}

// ─── 7. Edit Fee Rate (with audit log) ───────────────────────────────────

export async function updateFeeRate(params: {
  agreementId: string
  newRate: number
  changedByUserId: string
  reason: string
}): Promise<void> {
  const { agreementId, newRate, changedByUserId, reason } = params

  const agreement = await db.billingAgreement.findUnique({
    where: { id: agreementId },
  })
  if (!agreement) throw new Error(`Agreement ${agreementId} not found`)

  const previousRate = Number(agreement.feeRate) || 0
  if (previousRate === newRate) return

  await db.billingAgreement.update({
    where: { id: agreementId },
    data: { feeRate: new Prisma.Decimal(newRate) },
  })

  await db.billingFeeRateChange.create({
    data: {
      agreementId,
      changedByUserId,
      previousRate: new Prisma.Decimal(previousRate),
      newRate: new Prisma.Decimal(newRate),
      reason,
    },
  })
}

// ─── 8. Get Billing Overview (SUPER_ADMIN — all tenants) ─────────────────

export async function getBillingOverview(): Promise<{
  agreements: any[]
  totalFeesThisMonth: number
  totalInvestmentRemaining: number
  totalRecoveries: number
  activeAgreements: number
  recoveredAgreements: number
}> {
  const agreements = await db.billingAgreement.findMany({
    where: { status: { in: ['ACTIVE', 'RECOVERED'] } },
    include: {
      tenant: { select: { id: true, name: true, country: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const thisMonthLedger = await db.transactionFeeLedger.findMany({
    where: {
      recordedAt: { gte: monthStart },
      reversed: false,
    },
    select: { mobipayFee: true, agreementId: true },
  })

  const totalFeesThisMonth = thisMonthLedger.reduce((sum, l) => sum + Number(l.mobipayFee), 0)

  const totalInvestmentRemaining = agreements
    .filter(a => a.billingModel === 'VENDOR_FINANCING' && a.status === 'ACTIVE')
    .reduce((sum, a) => sum + Math.max(0, Number(a.upfrontInvestment) - Number(a.recoveredAmount)), 0)

  return {
    agreements,
    totalFeesThisMonth,
    totalInvestmentRemaining,
    totalRecoveries: agreements.filter(a => a.status === 'RECOVERED').length,
    activeAgreements: agreements.filter(a => a.status === 'ACTIVE').length,
    recoveredAgreements: agreements.filter(a => a.status === 'RECOVERED').length,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function roundTo(n: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(n * factor) / factor
}
