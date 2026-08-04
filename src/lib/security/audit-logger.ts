/**
 * Audit Logger
 * ─────────────
 * Logs security-relevant actions to the AuditLog table.
 * Non-blocking — if logging fails, the main operation still succeeds.
 *
 * Usage:
 *   import { logAction } from '@/lib/security/audit-logger'
 *   await logAction({
 *     userId: ctx.userId,
 *     tenantId: ctx.tenantId,
 *     action: 'PAYMENT_INITIATED',
 *     entityType: 'NssfContribution',
 *     entityId: contribution.id,
 *     details: { amount: 50000, farmerId: 'xxx' },
 *     ipAddress: request.headers.get('x-forwarded-for') || '',
 *   })
 */

import { db } from '@/lib/db'

interface AuditLogParams {
  userId: string
  tenantId: string
  action: string
  entityType: string
  entityId: string
  details?: Record<string, unknown>
  ipAddress?: string
}

export async function logAction(params: AuditLogParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || null,
        createdAt: new Date(),
      },
    })
  } catch (err) {
    // Non-blocking — log to console but don't fail the main operation
    console.error('[audit-logger] Failed to log action:', err)
  }
}

/**
 * Logs a payment-related action with before/after values.
 * Used for financial audit trails (NSSF contributions, settlements, etc.)
 */
export async function logPaymentAction(params: {
  userId: string
  tenantId: string
  action: string
  entityType: string
  entityId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  ipAddress?: string
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: JSON.stringify({
          before: params.before || null,
          after: params.after || null,
        }),
        ipAddress: params.ipAddress || null,
        createdAt: new Date(),
      },
    })
  } catch (err) {
    console.error('[audit-logger] Failed to log payment action:', err)
  }
}
