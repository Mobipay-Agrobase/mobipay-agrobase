/**
 * Secure Audit Logger (Tamper-Evident)
 * ───────────────────────────────────
 * Extends the existing audit-logger.ts with hash chaining so any tampering
 * with the audit log is detectable. Adapted from src/lib/impact/hash-chain.ts.
 *
 * Each log entry's hash = SHA-256(prevHash + canonical(data) + timestamp)
 * If any row is modified or deleted, the chain breaks — verifiable via verifyChain().
 *
 * SECURITY: The SecureAuditLog table should have NO UPDATE/DELETE permissions
 * for the application database role. Only an admin/forensics role should have those.
 * In Postgres: REVOKE UPDATE, DELETE ON "SecureAuditLog" FROM app_role;
 */

import crypto from 'crypto'
import { db } from '@/lib/db'

export interface SecureAuditParams {
  tenantId?: string
  userId?: string
  actorName?: string
  actorRole?: string
  action: string
  entityType: string
  entityId?: string
  description?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  httpMethod?: string
  path?: string
}

/**
 * Compute the SHA-256 hash for an audit log entry.
 * Hash = SHA256(prevHash + canonical(data) + timestamp)
 * 
 * Canonical JSON: keys sorted, no whitespace — deterministic.
 */
function computeAuditHash(
  prevHash: string | null,
  data: Record<string, unknown>,
  timestamp: Date
): string {
  const canonical = JSON.stringify(data, Object.keys(data).sort())
  const payload = `${prevHash ?? ''}|${canonical}|${timestamp.toISOString()}`
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex')
}

/**
 * Append a tamper-evident audit log entry.
 * Non-blocking — if logging fails, the main operation still succeeds
 * (but the error is logged to console for monitoring).
 * 
 * SECURITY NOTE: For maximum integrity, this should be wrapped in a
 * serializable transaction that locks the last row. For now we use
 * upsert-style logic with chainIndex as the unique constraint.
 */
export async function logSecureAction(params: SecureAuditParams): Promise<void> {
  try {
    // Get the last entry's hash + chainIndex atomically
    const lastEntry = await db.secureAuditLog.findFirst({
      orderBy: { chainIndex: 'desc' },
      select: { hash: true, chainIndex: true },
    })

    const prevHash = lastEntry?.hash ?? null
    const chainIndex = (lastEntry?.chainIndex ?? 0) + 1
    const timestamp = new Date()

    const data: Record<string, unknown> = {
      tenantId: params.tenantId,
      userId: params.userId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      httpMethod: params.httpMethod,
      path: params.path,
      chainIndex,
    }

    const hash = computeAuditHash(prevHash, data, timestamp)

    await db.secureAuditLog.create({
      data: {
        hash,
        prevHash,
        chainIndex,
        tenantId: params.tenantId,
        userId: params.userId,
        actorName: params.actorName,
        actorRole: params.actorRole,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        httpMethod: params.httpMethod,
        path: params.path,
        createdAt: timestamp,
      },
    })
  } catch (err) {
    // Non-blocking — log to console but don't fail the main operation
    console.error('[secure-audit-logger] Failed to log action:', err)
  }
}

/**
 * Verify the integrity of the audit log chain.
 * Returns a list of broken links (if any) — empty array means chain is intact.
 * 
 * SECURITY: Run this on a schedule (daily) and alert if any breaks are found.
 */
export async function verifyAuditChain(limit: number = 10000): Promise<{
  intact: boolean
  totalChecked: number
  brokenAt: number[]  // chainIndex values where the chain is broken
}> {
  const entries = await db.secureAuditLog.findMany({
    orderBy: { chainIndex: 'asc' },
    take: limit,
    select: {
      chainIndex: true,
      hash: true,
      prevHash: true,
      action: true,
      entityType: true,
      entityId: true,
      description: true,
      tenantId: true,
      userId: true,
      actorName: true,
      actorRole: true,
      metadata: true,
      ipAddress: true,
      userAgent: true,
      httpMethod: true,
      path: true,
      createdAt: true,
    },
  })

  const brokenAt: number[] = []
  let prevHash: string | null = null

  for (const entry of entries) {
    // Verify prevHash matches the previous entry's hash
    if (entry.prevHash !== prevHash) {
      brokenAt.push(entry.chainIndex)
    }

    // Recompute the hash and verify it matches
    const data: Record<string, unknown> = {
      tenantId: entry.tenantId,
      userId: entry.userId,
      actorName: entry.actorName,
      actorRole: entry.actorRole,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      description: entry.description,
      metadata: entry.metadata,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      httpMethod: entry.httpMethod,
      path: entry.path,
      chainIndex: entry.chainIndex,
    }
    const recomputedHash = computeAuditHash(entry.prevHash, data, entry.createdAt)
    if (recomputedHash !== entry.hash) {
      brokenAt.push(entry.chainIndex)
    }

    prevHash = entry.hash
  }

  return {
    intact: brokenAt.length === 0,
    totalChecked: entries.length,
    brokenAt,
  }
}

/**
 * Query secure audit logs with filters.
 */
export async function querySecureAuditLog(params: {
  tenantId?: string
  userId?: string
  entityType?: string
  entityId?: string
  action?: string
  startDate?: Date
  endDate?: Date
  limit?: number
}) {
  const where: {
    tenantId?: string
    userId?: string
    entityType?: string
    entityId?: string
    action?: string
    createdAt?: { gte?: Date; lte?: Date }
  } = {}
  if (params.tenantId) where.tenantId = params.tenantId
  if (params.userId) where.userId = params.userId
  if (params.entityType) where.entityType = params.entityType
  if (params.entityId) where.entityId = params.entityId
  if (params.action) where.action = params.action
  if (params.startDate || params.endDate) {
    where.createdAt = {}
    if (params.startDate) where.createdAt.gte = params.startDate
    if (params.endDate) where.createdAt.lte = params.endDate
  }
  return db.secureAuditLog.findMany({
    where,
    orderBy: { chainIndex: 'desc' },
    take: params.limit ?? 100,
  })
}
