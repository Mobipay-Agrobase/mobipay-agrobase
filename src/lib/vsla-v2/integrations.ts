/**
 * VSLA V2 — Cross-Module Integration Service
 * ───────────────────────────────────────────
 * This is the SINGLE entry point that other modules (purchases, sales,
 * marketplace, insurance, NSSF, carbon) use to interact with VSLA groups.
 * 
 * Every integration creates a cashbox entry + master transaction, keeping
 * the group's financial position always accurate.
 */

import { db } from '@/lib/db'
import { logSecureAction } from '@/lib/security/secure-audit-logger'

export type IntegrationType =
  | 'INPUT_PURCHASE'      // Phase 5: Group buys farm inputs
  | 'PRODUCT_SALE'        // Phase 5: Group sells produce
  | 'MARKETPLACE_SALE'    // Phase 5: Marketplace order completes
  | 'INSURANCE_PREMIUM'   // Phase 6: Group pays insurance premium
  | 'INSURANCE_CLAIM'     // Phase 6: Insurance claim payout
  | 'NSSF_CONTRIBUTION'   // Phase 6: Member NSSF contribution from savings
  | 'CARBON_CREDIT'       // Phase 6: Carbon credit payout
  | 'MFI_LOAN_DISBURSEMENT' // Phase 4: MFI loan disbursed to VSLA member
  | 'MFI_LOAN_REPAYMENT'    // Phase 4: MFI loan repayment from VSLA member

interface IntegrationParams {
  groupId: string
  type: IntegrationType
  amount: number
  memberId?: string
  refType?: string
  refId?: string
  description: string
  recordedByName: string
  recordedById?: string
  tenantId?: string
}

/**
 * Record a cross-module transaction in the VSLA cashbox.
 * Called by purchases, sales, marketplace, insurance, NSSF, carbon modules.
 */
export async function recordVslaIntegration(params: IntegrationParams) {
  const { groupId, type, amount, memberId, refType, refId, description, recordedByName, recordedById, tenantId } = params

  // Determine direction and cashbox type
  // Money OUT of cashbox: input purchases, insurance premiums, NSSF contributions, MFI repayments
  // Money INTO cashbox: product sales, marketplace sales, insurance claims, carbon credits, MFI disbursements
  const outTypes: IntegrationType[] = ['INPUT_PURCHASE', 'INSURANCE_PREMIUM', 'NSSF_CONTRIBUTION', 'MFI_LOAN_REPAYMENT']
  const direction = outTypes.includes(type) ? 'OUT' : 'IN'

  // Map integration type to cashbox entry type
  const cashboxTypeMap: Record<IntegrationType, string> = {
    INPUT_PURCHASE: 'LOAN_OUT',
    PRODUCT_SALE: 'SAVING_IN',
    MARKETPLACE_SALE: 'SAVING_IN',
    INSURANCE_PREMIUM: 'WELFARE_OUT',
    INSURANCE_CLAIM: 'SAVING_IN',
    NSSF_CONTRIBUTION: 'LOAN_OUT',
    CARBON_CREDIT: 'SAVING_IN',
    MFI_LOAN_DISBURSEMENT: 'SAVING_IN',
    MFI_LOAN_REPAYMENT: 'LOAN_REPAY_IN',
  }

  // Map to transaction type
  const transactionTypeMap: Record<IntegrationType, string> = {
    INPUT_PURCHASE: 'LOAN_DISBURSEMENT',
    PRODUCT_SALE: 'SAVING',
    MARKETPLACE_SALE: 'SAVING',
    INSURANCE_PREMIUM: 'WELFARE_CLAIM',
    INSURANCE_CLAIM: 'WELFARE_CONTRIBUTION',
    NSSF_CONTRIBUTION: 'LOAN_DISBURSEMENT',
    CARBON_CREDIT: 'SAVING',
    MFI_LOAN_DISBURSEMENT: 'LOAN_DISBURSEMENT',
    MFI_LOAN_REPAYMENT: 'LOAN_REPAYMENT',
  }

  // Get group with current cashbox
  const group = await db.vslaGroupV2.findUnique({ where: { id: groupId } })
  if (!group) throw new Error('VSLA group not found')

  const balanceBefore = group.cashboxBalance
  const balanceAfter = direction === 'IN'
    ? balanceBefore + amount
    : balanceBefore - amount

  // Check sufficient funds for OUT transactions
  if (direction === 'OUT' && balanceAfter < 0) {
    throw new Error(`Insufficient cashbox balance. Available: UGX ${balanceBefore.toLocaleString()}, needed: UGX ${amount.toLocaleString()}`)
  }

  // Update group cashbox
  await db.vslaGroupV2.update({
    where: { id: groupId },
    data: { cashboxBalance: balanceAfter },
  })

  const transactionRef = `INT-${type}-${Date.now().toString(36).toUpperCase()}`

  // Create cashbox entry
  const cashboxEntry = await db.vslaCashboxEntryV2.create({
    data: {
      groupId,
      type: cashboxTypeMap[type],
      amount,
      balanceBefore,
      balanceAfter,
      memberId,
      transactionRef,
      description,
      recordedById,
      recordedByName,
    },
  })

  // Create master transaction
  const transaction = await db.vslaTransactionV2.create({
    data: {
      groupId,
      memberId,
      type: transactionTypeMap[type],
      amount,
      direction,
      description,
      transactionRef,
      status: 'COMPLETED',
      recordedById,
      recordedByName,
    },
  })

  // Secure audit log
  if (tenantId && recordedById) {
    await logSecureAction({
      tenantId,
      userId: recordedById,
      actorName: recordedByName,
      action: `VSLA_V2_INTEGRATION_${type}`,
      entityType: 'VslaCashboxEntryV2',
      entityId: cashboxEntry.id,
      description: `${type} integration: UGX ${amount.toLocaleString()} ${direction} — ${description}`,
      metadata: {
        type,
        amount,
        direction,
        groupId,
        memberId,
        refType,
        refId,
        balanceBefore,
        balanceAfter,
        transactionRef,
      },
      httpMethod: 'POST',
      path: '/api/vsla-v2/integrations',
    })
  }

  return {
    cashboxEntry,
    transaction,
    cashboxBalance: balanceAfter,
    direction,
    transactionRef,
  }
}

/**
 * Get all integration transactions for a group (cross-module).
 */
export async function getGroupIntegrations(groupId: string, limit: number = 50) {
  // Cashbox entries that have descriptions matching integration types
  const entries = await db.vslaCashboxEntryV2.findMany({
    where: {
      groupId,
      description: {
        contains: 'INT-',
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return entries
}

/**
 * Get all integration transactions across all groups for a tenant.
 */
export async function getTenantIntegrations(tenantScope: string[], limit: number = 100) {
  const groups = await db.vslaGroupV2.findMany({
    where: { tenantId: { in: tenantScope } },
    select: { id: true, name: true, district: true },
  })
  const groupIds = groups.map(g => g.id)

  const entries = await db.vslaCashboxEntryV2.findMany({
    where: {
      groupId: { in: groupIds },
      description: { contains: 'INT-' },
    },
    include: {
      group: { select: { name: true, district: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return entries
}
