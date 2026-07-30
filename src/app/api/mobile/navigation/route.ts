import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { entitlementEngine } from '@/lib/entitlements/engine'

/**
 * GET /api/mobile/navigation
 *   Returns the dynamic navigation menu for the mobile app, based on:
 *     1. The user's role (RBAC permissions)
 *     2. The tenant's module entitlements (which modules are enabled)
 *
 *   The mobile app fetches this on login + caches it locally. When the
 *   tenant's entitlements change (e.g. VSLA disabled by super-admin),
 *   the mobile app reflects the change on next sync.
 *
 *   Returns: {
 *     version: string,          // cache version (changes when nav config changes)
 *     destinations: [           // ordered list of bottom-nav destinations
 *       {
 *         key: string,          // route key (e.g. "farmers", "vsla")
 *         label: string,        // display label
 *         icon: string,         // Material icon name
 *         route: string,        // go_router path
 *         badge?: string,       // optional badge (e.g. "3" for pending count)
 *       }
 *     ],
 *     quickActions: [           // shortcut actions on the dashboard
 *       { label, icon, route }
 *     ]
 *   }
 *
 *   Auth: any authenticated user. Non-super-admin users get only their
 *   permitted modules. SUPER_ADMIN gets the platform overview only.
 */

interface NavDestination {
  key: string
  label: string
  icon: string
  route: string
  badge?: string
}

interface QuickAction {
  label: string
  icon: string
  route: string
}

interface MobileNavConfig {
  version: string
  destinations: NavDestination[]
  quickActions: QuickAction[]
}

// All possible mobile destinations, keyed by module code.
// The icon names match Flutter's Material Icons.
const ALL_DESTINATIONS: Record<string, NavDestination> = {
  dashboard: { key: 'dashboard', label: 'Home', icon: 'dashboard', route: '/' },
  plots: { key: 'plots', label: 'Plots', icon: 'map', route: '/plots' },
  farmers: { key: 'farmers', label: 'Farmers', icon: 'people', route: '/farmers' },
  farm_lands: { key: 'farm_lands', label: 'Farms', icon: 'landscape', route: '/farm-lands' },
  purchases: { key: 'purchases', label: 'Purchase', icon: 'shopping_cart', route: '/purchase/new' },
  payments: { key: 'payments', label: 'Pay', icon: 'payment', route: '/payments' },
  loans: { key: 'loans', label: 'Loans', icon: 'account_balance_wallet', route: '/loans' },
  vsla: { key: 'vsla', label: 'VSLA', icon: 'savings', route: '/vsla' },
  mfi: { key: 'mfi', label: 'MFI', icon: 'account_balance', route: '/mfi' },
  carbon: { key: 'carbon', label: 'Carbon', icon: 'eco', route: '/carbon' },
  compliance: { key: 'compliance', label: 'Comply', icon: 'verified_user', route: '/compliance' },
  impact: { key: 'impact', label: 'Impact', icon: 'insights', route: '/impact' },
  profile: { key: 'profile', label: 'Profile', icon: 'person', route: '/profile' },
  reset: { key: 'reset', label: 'ReSET', icon: 'volunteer_activism', route: '/reset-dashboard' },
  trainings: { key: 'trainings', label: 'Training', icon: 'school', route: '/profile/trainings' },
}

// Quick actions shown on the dashboard (shortcuts)
const ALL_QUICK_ACTIONS: Record<string, QuickAction> = {
  new_farmer: { label: 'New Farmer', icon: 'person_add', route: '/farmers' },
  new_purchase: { label: 'New Purchase', icon: 'shopping_cart', route: '/purchase/new' },
  new_payment: { label: 'Record Payment', icon: 'payment', route: '/payments' },
  log_practice: { label: 'Log Practice', icon: 'eco', route: '/impact/practices' },
  view_passport: { label: 'My Passport', icon: 'badge', route: '/impact/passport' },
  input_distribution: { label: 'Inputs', icon: 'inventory', route: '/input-distribution' },
  farmer_ledger: { label: 'Ledger', icon: 'receipt_long', route: '/farmers' },
}

// Map RBAC module codes → mobile destination keys
const MODULE_TO_DESTINATION: Record<string, string> = {
  dashboard: 'dashboard',
  farmers: 'farmers',
  vsla: 'vsla',
  marketplace: 'purchases',
  payments: 'payments',
  loans: 'loans',
  training: 'trainings',
  trace: 'plots',
  compliance: 'compliance',
  communication: 'profile',
  reports: 'impact',
  carbon: 'carbon',
  mfi: 'mfi',
  transport: 'purchases',
  impact_assessment: 'impact',
  farm_visits: 'farmers',
}

// Entitlement module codes → mobile destination keys
const ENTITLEMENT_TO_DESTINATION: Record<string, string> = {
  VSLA: 'vsla',
  MARKETPLACE: 'purchases',
  PAYMENTS: 'payments',
  LOANS: 'loans',
  TRAINING: 'trainings',
  TRACE: 'plots',
  COMPLIANCE: 'compliance',
  CARBON: 'carbon',
  MFI: 'mfi',
  REPORTS: 'impact',
  SURVEYS: 'impact',
  INVENTORY: 'purchases',
  LOGISTICS: 'purchases',
  CONTRACTS: 'purchases',
  SATELLITE: 'plots',
  API_ACCESS: 'profile',
  CREDIT_SCORING: 'loans',
  COOPERATIVE: 'purchases',
  EXPORT: 'profile',
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    if (!ctx.tenantId && !ctx.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

    // SUPER_ADMIN gets a minimal nav (platform overview only — they use the web admin)
    if (ctx.isSuperAdmin) {
      return NextResponse.json({
        version: 'super-admin-v1',
        destinations: [
          ALL_DESTINATIONS.dashboard,
          ALL_DESTINATIONS.profile,
        ],
        quickActions: [],
      } satisfies MobileNavConfig)
    }

    // 1. Get the user's permitted modules from RBAC
    const role = ctx.role
    const rbacModules = new Set<string>()
    for (const [moduleCode] of Object.entries(MODULE_TO_DESTINATION)) {
      if (hasPermission(role, `${moduleCode}:read`)) {
        rbacModules.add(moduleCode)
      }
    }

    // 2. Get the tenant's enabled module entitlements
    const enabledEntitlements = await entitlementEngine.getEnabledModules(ctx.tenantId)
    const entitlementModules = new Set(enabledEntitlements)

    // 3. Build the destination list — a destination is included if:
    //    a. It's always-visible (dashboard, profile), OR
    //    b. The user's role has read permission for the corresponding RBAC module, AND
    //    c. The tenant's entitlements include the corresponding module code (if mapped)
    const destinations: NavDestination[] = []
    const alwaysVisible = ['dashboard', 'profile']

    // Add dashboard first
    destinations.push(ALL_DESTINATIONS.dashboard)

    // Add module-based destinations in a sensible order
    const moduleOrder = [
      'plots', 'farmers', 'farm_lands', 'purchases', 'payments',
      'loans', 'vsla', 'mfi', 'carbon', 'compliance', 'impact', 'trainings', 'reset',
    ]

    for (const destKey of moduleOrder) {
      if (alwaysVisible.includes(destKey)) continue

      // Find the RBAC module code that maps to this destination
      const rbacModule = Object.entries(MODULE_TO_DESTINATION)
        .find(([, dest]) => dest === destKey)?.[0]

      // Find the entitlement module code that maps to this destination
      const entitlementModule = Object.entries(ENTITLEMENT_TO_DESTINATION)
        .find(([, dest]) => dest === destKey)?.[0]

      // Check RBAC permission
      const hasRbac = !rbacModule || hasPermission(role, `${rbacModule}:read`)

      // Check entitlement (if the destination maps to an entitlement module)
      const hasEntitlement = !entitlementModule || entitlementModules.has(entitlementModule)

      if (hasRbac && hasEntitlement) {
        destinations.push(ALL_DESTINATIONS[destKey])
      }
    }

    // Add profile last
    destinations.push(ALL_DESTINATIONS.profile)

    // 4. Build quick actions based on permissions
    const quickActions: QuickAction[] = []
    if (hasPermission(role, 'farmers:create')) {
      quickActions.push(ALL_QUICK_ACTIONS.new_farmer)
    }
    if (hasPermission(role, 'purchases:create')) {
      quickActions.push(ALL_QUICK_ACTIONS.new_purchase)
    }
    if (hasPermission(role, 'payments:create')) {
      quickActions.push(ALL_QUICK_ACTIONS.new_payment)
    }
    if (hasPermission(role, 'carbon:read')) {
      quickActions.push(ALL_QUICK_ACTIONS.log_practice)
      quickActions.push(ALL_QUICK_ACTIONS.view_passport)
    }
    if (hasPermission(role, 'input_aggregation:read')) {
      quickActions.push(ALL_QUICK_ACTIONS.input_distribution)
    }

    // 5. Compute a version hash for cache invalidation.
    // The version changes when the destination list or quick actions change,
    // so the mobile app knows to refresh its local cache.
    const versionInput = destinations.map(d => d.key).join(',') + '|' + quickActions.map(q => q.label).join(',')
    const version = `v1-${Buffer.from(versionInput).toString('base64url').slice(0, 16)}`

    return NextResponse.json({
      version,
      destinations,
      quickActions,
    } satisfies MobileNavConfig)
  } catch (error) {
    console.error('[mobile/navigation GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch navigation config' },
      { status: 500 },
    )
  }
}
