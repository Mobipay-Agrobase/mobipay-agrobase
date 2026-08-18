import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { checkRateLimit } from '@/middleware/edge-rate-limiter'
import {
  getClientIp,
  logRequest,
  logRateLimit,
  logAuthFailure,
  logPermissionDenied,
  logEntitlementDenied,
} from '@/middleware/edge-logger'
import { resolveModuleForPath, checkEntitlement, getTenantActiveStatus } from '@/middleware/edge-entitlements'

// ─── Route Categories ──────────────────────────────────────────────────────

// Routes that are publicly accessible without authentication
const PUBLIC_ROUTES = [
  '/api/auth/',
  '/api/health',
  '/api/route', // basic health check
  '/api/ussd/', // USSD callback — public (members authenticate via Member ID + PIN)
  '/api/public/', // public survey fetch + submit (for /survey/[id] page)
]

// Routes that only need auth (no tenant isolation) — system-level
const SYSTEM_ROUTES = [
  '/api/settings/geo/',
  '/api/seed',
  '/api/entitlements',   // system route — every authenticated user needs this to load sidebar menus
  '/api/modules',        // system route — module list
  '/api/settings/entitlements', // system route — admin config
  '/api/admin/module-store', // system route — Super Admin module management
  '/api/plots',          // plots API — permission checked via 'trace:read' in sidebar, not 'plots:read'
  '/api/plots/stats',    // same
  '/api/plots/geojson',  // same
  '/api/audit-logs',     // every authenticated user can read their own audit logs
  '/api/admin/simulate/', // simulation status check runs on every page load — auth-only, not module-gated
  '/api/mobile/',        // mobile API routes — permission checked inside each route handler
  '/api/channel/',       // USSD/IVR/SMS channel routes — permission checked inside each route handler
  '/api/vsla-v2/',       // VSLA V2 API routes — permission checked inside each route handler (hasPermission(ctx.role, 'vsla:read'))
  '/api/vsla-v3/',       // VSLA V3 API routes — same pattern
  '/api/notifications',  // notification routes — auth-only
  '/api/support/',       // support ticket routes — auth-only
  '/api/branding',       // branding config — auth-only
  '/api/catalog',        // dropdown / catalog reference data — auth-only (writes gated in the route)
  '/api/i18n',           // i18n translations — auth-only
  '/api/credit-score/',  // credit scoring — auth-only (tenant-scoped inside)
  '/api/credit-scores',  // same
  '/api/dashboard',      // dashboard stats — auth-only (tenant-scoped inside)
  '/api/dashboard/',     // dashboard sub-routes (stats, ekibbo-analytics) — auth-only
  '/api/reports/',       // reports — permission checked via 'reports:read' but route prefix differs
  '/api/impact/',        // impact routes — auth-only
  '/api/satellite/',     // satellite routes — auth-only
  '/api/master',         // master data (crops, seeds, fertilizers, soil types) — auth-only, tenant-scoped inside
  '/api/cooperatives',   // cooperatives — permission checked inside the route handler (farmers:create OR users:read)
  '/api/field-staff',    // field staff — permission checked inside the route handler (same pattern)
  '/api/farmer-groups',  // farmer groups — auth-only (tenant-scoped inside)
  '/api/data-quality',   // data quality report — auth-only (admin-only inside)
  '/api/crop-varieties', // crop variety master — auth-only (farmer module)
  '/api/attachments',    // attachments — auth-only (permission checked inside route handler)
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function matchesRoute(path: string, patterns: string[]): boolean {
  return patterns.some(p => path.startsWith(p))
}

function getAllowedTenantIds(
  role: string | undefined,
  tenantId: string | undefined,
  tokenTenantScope: string[] | undefined
): string[] | null {
  if (role === 'SUPER_ADMIN') return null
  // For COUNTRY_ADMIN, use the pre-computed tenantScope from the JWT token
  // (resolved at login time via getDescendantTenantIds)
  if (role === 'COUNTRY_ADMIN' && tokenTenantScope && tokenTenantScope.length > 0) {
    return tokenTenantScope
  }
  if (!tenantId) return []
  return [tenantId]
}

/**
 * Build standard X-RateLimit-* response headers.
 */
function rateLimitHeaders(
  result: { remaining: number; limit: number; reset: number; retryAfterMs: number }
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': String(result.remaining === Infinity ? -1 : result.remaining),
    'X-RateLimit-Limit': String(result.limit || 120),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
  }
  if (result.retryAfterMs > 0) {
    headers['Retry-After'] = String(Math.ceil(result.retryAfterMs / 1000))
  }
  return headers
}

// ─── Main Middleware ────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const startedAt = Date.now()
  const clientIp = getClientIp(request)
  const method = request.method

  // Common request context for logging
  const reqCtx = {
    method,
    path: pathname,
    ip: clientIp,
    userAgent: request.headers.get('user-agent') || undefined,
    startedAt,
  }

  // Skip non-API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // ─── 0. RATE LIMITING (before auth — protect auth endpoints too) ─────────
  const isPublic = matchesRoute(pathname, PUBLIC_ROUTES)
  const rlKey = isPublic ? `pub:${clientIp}` : `ip:${clientIp}`

  const rlResult = checkRateLimit(rlKey, pathname)
  if (!rlResult.allowed) {
    logRateLimit(reqCtx, rlResult.retryAfterMs)
    logRequest(reqCtx, { status: 429 })

    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil(rlResult.retryAfterMs / 1000),
      },
      {
        status: 429,
        headers: rateLimitHeaders(rlResult),
      }
    )
  }

  // Allow public routes (after rate limiting)
  if (isPublic) {
    logRequest(reqCtx, { status: 200 })
    const response = NextResponse.next()
    // Attach rate-limit info headers to public responses too
    for (const [k, v] of Object.entries(rateLimitHeaders(rlResult))) {
      response.headers.set(k, v)
    }
    return response
  }

  // ─── 1. AUTHENTICATION CHECK ─────────────────────────────────────────────
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token?.userId) {
    logAuthFailure(reqCtx)
    logRequest(reqCtx, { status: 401 })

    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Now we have a user — switch rate-limit key from IP to userId
  // This prevents one user from amplifying via multiple IPs
  const role = token.role as string | undefined
  const userTenantId = token.tenantId as string | undefined

  // ─── 1a. SIMULATION CONTEXT (SUPER_ADMIN only) ──────────────────────────
  // Decode the `simulate_tenant` cookie early so we can use the simulated
  // tenant ID for kill-switch + entitlement checks. We DO NOT apply the
  // simulation override on /api/admin/* paths (the SUPER_ADMIN needs to call
  // /api/admin/simulate/stop while simulating).
  let simulatedTenantId: string | undefined
  let simulatedTenantName: string | undefined
  let simulatedTenantType: string | undefined
  if (role === 'SUPER_ADMIN' && !pathname.startsWith('/api/admin/')) {
    const simulateCookie = request.cookies.get('simulate_tenant')?.value
    if (simulateCookie) {
      try {
        const decoded = JSON.parse(
          Buffer.from(simulateCookie, 'base64url').toString('utf-8'),
        ) as { tenantId: string; tenantName: string; tenantType: string; expiresAt: number }
        if (Date.now() < decoded.expiresAt && decoded.tenantId) {
          simulatedTenantId = decoded.tenantId
          simulatedTenantName = decoded.tenantName
          simulatedTenantType = decoded.tenantType
        }
      } catch {
        // Malformed cookie — ignore
      }
    }
  }
  const isSimulating = !!simulatedTenantId
  // The effective tenant ID is the simulated tenant when simulating, otherwise the user's home tenant.
  const effectiveTenantId = isSimulating ? simulatedTenantId! : userTenantId

  // ─── 1c. TENANT KILL SWITCH ──────────────────────────────────────────────
  // If the tenant is suspended (isActive = false), block all API access
  // except for SUPER_ADMIN who can still manage the platform.
  // When simulating, the SUPER_ADMIN is treated as a tenant user and is
  // subject to the kill-switch on the simulated tenant.
  if ((role !== 'SUPER_ADMIN' || isSimulating) && effectiveTenantId) {
    // Check cached tenant status from edge-entitlements
    // The cache is warmed on login and on Super Admin actions
    const tenantActive = getTenantActiveStatus(effectiveTenantId)
    if (tenantActive === false) {
      logPermissionDenied({ ...reqCtx, userId: token.userId as string, role })
      logRequest({ ...reqCtx, userId: token.userId as string }, { status: 403 })

      return NextResponse.json(
        {
          success: false,
          error: 'Your organization\'s access has been suspended. Please contact your administrator.',
        },
        { status: 403 }
      )
    }
  }

  // ─── 1b. PER-USER RATE LIMITING (authenticated) ─────────────────────────
  const userRlKey = `user:${token.userId}`
  const userRlResult = checkRateLimit(userRlKey, pathname, role)

  if (!userRlResult.allowed) {
    logRateLimit({ ...reqCtx, userId: token.userId as string }, userRlResult.retryAfterMs)
    logRequest({ ...reqCtx, userId: token.userId as string }, { status: 429 })

    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil(userRlResult.retryAfterMs / 1000),
      },
      {
        status: 429,
        headers: rateLimitHeaders(userRlResult),
      }
    )
  }

  // ─── 2. PERMISSION CHECK (basic module access) ───────────────────────────
  const moduleMatch = pathname.match(/^\/api\/([a-z_-]+)/)
  if (moduleMatch) {
    // Map URL module names to permission module names (aliases)
    const MODULE_ALIASES: Record<string, string> = {
      'vsla-v2': 'vsla',       // /api/vsla-v2/* uses same permissions as /api/vsla/*
      'vsla-v3': 'vsla',
      'nssf-contributions': 'nssf',
      'nssf-settlement': 'nssf',
      'ivr-campaigns': 'communication',
      'sms-broadcasts': 'communication',
      'ussd-sessions': 'communication',
      'messages': 'communication',
      'farm-visits': 'farm_visits',
      'impact-assessments': 'impact_assessment',
      'crop-stages': 'farmers',
      'crop-calendars': 'farmers',
      'input-products': 'input_aggregation',
      'input-dealers': 'input_aggregation',
      'input-requests': 'input_aggregation',
      'input-distribution': 'input_aggregation',
      'market': 'marketplace',
      'cooperative': 'marketplace',
      'logistics': 'transport',
      'quality': 'trace',
      'inventory': 'trace',
      'escrow': 'payments',
      'settlements': 'payments',
      'api-keys': 'settings',
      'companies': 'companies',
      'cultivations': 'farmers',
      'farm-lands': 'farmers',
      'farm-polygons': 'farmers',
      'trainings': 'training',
      'practices': 'farm_visits',
      'feedback': 'feedback',
      'surveys': 'surveys',
      'webhooks': 'settings',
      'exports': 'reports',
      'bulk': 'settings',
      'attachments': 'farmers',
      'sacco': 'sacco',
    }
    const moduleName = MODULE_ALIASES[moduleMatch[1]] || moduleMatch[1]
    if (!matchesRoute(pathname, SYSTEM_ROUTES)) {
      const { hasPermission } = await import('@/lib/permissions')
      const canRead = hasPermission(role || '', `${moduleName}:read`)
      if (!canRead) {
        logPermissionDenied({ ...reqCtx, userId: token.userId as string, role })
        logRequest({ ...reqCtx, userId: token.userId as string }, { status: 403 })

        return NextResponse.json(
          { success: false, error: 'Insufficient permissions for this module' },
          { status: 403 }
        )
      }
    }
  }

  // ─── 2b. ENTITLEMENT CHECK (module access based on tenant's plan) ──────
  // Resolves /api/vsla/* → VSLA module, then checks the in-memory entitlement cache.
  // Core routes (dashboard, users, settings, etc.) are not mapped → always allowed.
  // SUPER_ADMIN bypasses entitlement checks — EXCEPT when simulating a tenant,
  // in which case the simulated tenant's entitlements apply. Fail-open on cache miss/stale.
  const runEntitlementCheck = effectiveTenantId && moduleMatch && (role !== 'SUPER_ADMIN' || isSimulating)
  if (runEntitlementCheck) {
    const entitlementModule = resolveModuleForPath(pathname)
    if (entitlementModule) {
      const hasEntitlement = checkEntitlement(effectiveTenantId!, entitlementModule)
      if (!hasEntitlement) {
        logEntitlementDenied(
          { ...reqCtx, userId: token.userId as string },
          entitlementModule,
          effectiveTenantId!,
        )
        logRequest({ ...reqCtx, userId: token.userId as string }, { status: 403 })

        return NextResponse.json(
          {
            success: false,
            error: `Module '${entitlementModule}' is not included in your current plan. Contact your administrator to upgrade.`,
            module: entitlementModule,
          },
          { status: 403 }
        )
      }
    }
  }

  // ─── 3. TENANT ISOLATION HEADER ─────────────────────────────────────────
  // When simulating, the effective tenant scope is just the simulated tenant.
  // Otherwise, SUPER_ADMIN sees all tenants; COUNTRY_ADMIN sees their descendant set;
  // everyone else sees only their home tenant.
  const tokenTenantScope = token.tenantScope as string[] | undefined
  const allowedTenantIds = isSimulating
    ? [simulatedTenantId!]
    : getAllowedTenantIds(role, userTenantId, tokenTenantScope)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', (token.userId as string) || '')
  requestHeaders.set('x-user-role', role || '')
  requestHeaders.set('x-tenant-id', effectiveTenantId || '')

  if (isSimulating) {
    // Flag the simulation so tenant.ts can expose it
    requestHeaders.set('x-simulated-tenant-id', simulatedTenantId!)
    if (simulatedTenantName) requestHeaders.set('x-simulated-tenant-name', simulatedTenantName)
    if (simulatedTenantType) requestHeaders.set('x-simulated-tenant-type', simulatedTenantType)
  }

  if (allowedTenantIds === null) {
    requestHeaders.set('x-tenant-scope', 'all')
  } else {
    requestHeaders.set('x-tenant-scope', allowedTenantIds.join(','))
  }

  // ─── 4. REQUEST TIMING HEADER (for API route-level duration logging) ─────
  requestHeaders.set('x-request-started-at', new Date().toISOString())

  // ─── 5. LOG + PASS THROUGH ───────────────────────────────────────────────
  const authedReqCtx = {
    ...reqCtx,
    userId: token.userId as string,
    tenantId: userTenantId || undefined,
    role: role || undefined,
  }
  logRequest(authedReqCtx, { status: 200 })

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // Attach rate-limit headers to successful responses
  for (const [k, v] of Object.entries(rateLimitHeaders(userRlResult))) {
    response.headers.set(k, v)
  }

  // Attach request ID for correlation
  const requestId = crypto.randomUUID()
  response.headers.set('X-Request-Id', requestId)
  requestHeaders.set('x-request-id', requestId)

  return response
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
}