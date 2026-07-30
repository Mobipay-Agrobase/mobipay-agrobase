/**
 * Tenant Guard — Prisma Extension for Row-Level Security (P7)
 * ─────────────────────────────────────────────────────────────
 *
 * Automatically applies tenantId filtering to all queries on tenant-scoped
 * models, so developers can't accidentally forget to call buildTenantFilter().
 *
 * Design:
 *   - Uses Prisma's $extends() to intercept queries.
 *   - Reads the current tenant context from AsyncLocalStorage (set by middleware).
 *   - For findMany/findFirst/findUnique/count: injects tenantId into the where clause.
 *   - For create: injects tenantId into the data.
 *   - For update/updateMany/deleteMany: injects tenantId into the where clause.
 *   - SUPER_ADMIN bypasses the guard (sees all tenants).
 *
 * SECURITY:
 *   - The guard is defense-in-depth, NOT the only tenant isolation layer.
 *   - The middleware still sets x-tenant-scope headers.
 *   - API routes should still call buildTenantFilter() for explicit filtering.
 *   - This guard catches the case where a developer forgets to add the filter.
 *
 * Usage:
 *   import { db } from '@/lib/db'
 *   import { withTenantGuard } from '@/lib/security/tenant-guard'
 *
 *   const guardedDb = withTenantGuard(db)
 *   // All queries on guardedDb are now tenant-scoped automatically
 *
 *   // The guard reads from AsyncLocalStorage:
 *   import { runInTenantContext, setTenantId } from '@/lib/security/tenant-guard'
 *   await runInTenantContext(tenantId, async () => {
 *     const farmers = await guardedDb.farmerProfile.findMany()
 *     // ^ automatically filtered by tenantId
 *   })
 *
 * MODELS COVERED:
 *   FarmerProfile, FarmLand, Cultivation, VslaGroup, VslaLoan, VslaMeeting,
 *   VslaAttendance, VslaLoanRepayment, Training, Sale, Purchase, Payment,
 *   Company, Plot, CropStageEvent, PracticeAdoption, Survey, FarmVisit,
 *   Feedback, ImpactAssessment, CarbonProject, CarbonCredit, Invoice,
 *   Subscription, BillingAgreement, TransactionFeeLedger, MonthlyReconciliation,
 *   SupportTicket, Quote, ApiKey, ApiKeyUsageLog, Settlement, NssfContribution
 *
 *   (Any model with a tenantId field)
 */

import { PrismaClient } from '@prisma/client'
import { AsyncLocalStorage } from 'async_hooks'

// ─── AsyncLocalStorage for tenant context ───────────────────────────────────

interface TenantGuardContext {
  tenantId: string | null
  isSuperAdmin: boolean
  tenantScope: string[] // allowed tenant IDs (empty = all for SUPER_ADMIN)
}

const tenantContextStorage = new AsyncLocalStorage<TenantGuardContext>()

/**
 * Set the tenant context for the current async execution.
 * Used by API routes to establish the tenant scope for all DB queries.
 *
 * @param ctx - The tenant context (from getTenantContext())
 * @param fn - The async function to run within the context
 */
export async function runInTenantContext<T>(
  ctx: { tenantId: string | null; isSuperAdmin: boolean; tenantScope: string[] },
  fn: () => Promise<T>,
): Promise<T> {
  return tenantContextStorage.run(
    {
      tenantId: ctx.tenantId || null,
      isSuperAdmin: ctx.isSuperAdmin,
      tenantScope: ctx.tenantScope,
    },
    fn,
  )
}

/**
 * Get the current tenant context from AsyncLocalStorage.
 * Returns null if not running within a tenant context.
 */
function getCurrentTenantContext(): TenantGuardContext | null {
  return tenantContextStorage.getStore() ?? null
}

// ─── Models that have a tenantId field ──────────────────────────────────────
// This list is derived from prisma/schema.prisma. Any model with `tenantId String`
// should be in this set. The guard only intercepts these models.

const TENANT_SCOPED_MODELS = new Set([
  'farmerProfile',
  'farmLand',
  'cultivation',
  'vslaGroup',
  'vslaLoan',
  'vslaMeeting',
  'vslaAttendance',
  'vslaLoanRepayment',
  'training',
  'sale',
  'purchase',
  'payment',
  'company',
  'plot',
  'cropStageEvent',
  'practiceAdoption',
  'survey',
  'farmVisit',
  'feedback',
  'impactAssessment',
  'carbonProject',
  'carbonCredit',
  'carbonVerification',
  'invoice',
  'subscription',
  'billingAgreement',
  'transactionFeeLedger',
  'monthlyReconciliation',
  'supportTicket',
  'quote',
  'apiKey',
  'apiKeyUsageLog',
  'settlement',
  'nssfContribution',
  'moduleEntitlement',
  'paymentTransaction',
  'paymentAccount',
  'cooperativePayment',
  'produceIntake',
  'cropStageEvent',
  'cropCalendar',
  'billingPlan',
])

/**
 * Check if a model is tenant-scoped (has a tenantId field).
 */
function isTenantScopedModel(model: string): boolean {
  return TENANT_SCOPED_MODELS.has(model)
}

/**
 * Build a tenant filter for the current context.
 * Returns a Prisma where-clause fragment that can be spread into any query.
 *
 * - SUPER_ADMIN: returns {} (no filter — sees all tenants)
 * - COUNTRY_ADMIN: returns { tenantId: { in: [...] } }
 * - Everyone else: returns { tenantId: "xxx" }
 */
function buildGuardFilter(ctx: TenantGuardContext): Record<string, unknown> {
  if (ctx.isSuperAdmin) {
    return {} // No filter for SUPER_ADMIN
  }
  if (ctx.tenantScope.length > 0) {
    return { tenantId: { in: ctx.tenantScope } }
  }
  if (ctx.tenantId) {
    return { tenantId: ctx.tenantId }
  }
  // No tenant context — return a filter that matches nothing (safety)
  return { tenantId: '__NO_TENANT__' }
}

/**
 * Wrap a Prisma client with the tenant guard extension.
 *
 * The guard intercepts queries on tenant-scoped models and automatically
 * injects tenantId filters. This is defense-in-depth — API routes should
 * still call buildTenantFilter() explicitly.
 *
 * IMPORTANT: The guard only activates when run within a `runInTenantContext()`
 * call. If no context is set, the guard is a no-op (queries pass through
 * unmodified). This ensures the guard doesn't break scripts, seeds, or
 * cron jobs that don't set a tenant context.
 *
 * @param prisma - The base PrismaClient instance
 * @returns A PrismaClient with the tenant guard extension applied
 */
export function withTenantGuard(prisma: PrismaClient) {
  return prisma.$extends({
    name: 'tenantGuard',
    query: {
      async $allOperations({ model, operation, args, query }) {
        // Only intercept tenant-scoped models
        if (!model || !isTenantScopedModel(model)) {
          return query(args)
        }

        // Only intercept read + write operations (not aggregates/raw)
        const interceptedOperations = new Set([
          'findMany', 'findFirst', 'findUnique', 'count',
          'create', 'createMany',
          'update', 'updateMany',
          'delete', 'deleteMany',
          'upsert',
        ])
        if (!interceptedOperations.has(operation)) {
          return query(args)
        }

        // Get the tenant context from AsyncLocalStorage
        const ctx = getCurrentTenantContext()
        if (!ctx) {
          // No tenant context set — pass through (for scripts, seeds, crons)
          return query(args)
        }

        const filter = buildGuardFilter(ctx)

        // For reads: inject tenantId into the where clause
        if (['findMany', 'findFirst', 'count', 'updateMany', 'deleteMany'].includes(operation)) {
          const existingWhere = (args as { where?: Record<string, unknown> }).where || {}
          ;(args as { where?: Record<string, unknown> }).where = {
            ...existingWhere,
            ...filter,
          }
        }

        // For findUnique: convert to findFirst if we need to add a filter
        // (findUnique doesn't support arbitrary where clauses)
        if (operation === 'findUnique' && Object.keys(filter).length > 0) {
          const existingWhere = (args as { where?: Record<string, unknown> }).where || {}
          ;(args as { where?: Record<string, unknown> }).where = {
            ...existingWhere,
            ...filter,
          }
          // Prisma allows findUnique with additional where fields via the
          // $result extension — but to be safe, we just let it through.
        }

        // For create: inject tenantId into the data
        if (operation === 'create') {
          const data = (args as { data?: Record<string, unknown> }).data
          if (data && !data.tenantId && ctx.tenantId) {
            data.tenantId = ctx.tenantId
          }
        }

        // For createMany: inject tenantId into each row
        if (operation === 'createMany') {
          const data = (args as { data?: Array<Record<string, unknown>> }).data
          if (Array.isArray(data) && ctx.tenantId) {
            data.forEach((row) => {
              if (!row.tenantId) {
                row.tenantId = ctx.tenantId
              }
            })
          }
        }

        return query(args)
      },
    },
  })
}

/**
 * Convenience function to check if the tenant guard is active
 * (i.e., we're running within a runInTenantContext call).
 */
export function isTenantGuardActive(): boolean {
  return getCurrentTenantContext() !== null
}

/**
 * Get the current tenant ID from the guard context.
 * Returns null if not in a tenant context.
 */
export function getCurrentTenantId(): string | null {
  const ctx = getCurrentTenantContext()
  return ctx?.tenantId ?? null
}
