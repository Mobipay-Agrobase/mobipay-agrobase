/**
 * Agrobase V3 — RBAC Permission Definitions
 *
 * Permissions follow the pattern:  module:action
 * Actions: read, create, update, delete, approve, manage, export, admin
 */

export type PermissionAction =
  | 'read' | 'create' | 'update' | 'delete'
  | 'approve' | 'manage' | 'export' | 'admin'

// ─── All permission names ──────────────────────────────────────────────────
export const MODULES = [
  'dashboard', 'farmers', 'vsla', 'sacco', 'marketplace', 'payments', 'loans',
  'reports', 'training', 'surveys', 'trace', 'compliance', 'communication',
  'input_aggregation', 'purchases', 'approvals', 'processing', 'sales',
  'deliveries', 'consignments', 'companies', 'users', 'settings',
  'agritrack', 'feedback', 'farm_visits', 'impact_assessment',
  'channel_sim', 'carbon', 'mfi', 'transport', 'profile', 'reset', 'entitlements', 'modules',
] as const

export type ModuleKey = (typeof MODULES)[number]

// All valid permission names: "module:action"
export function makePermissionName(module: string, action: PermissionAction): string {
  return `${module}:${action}`
}

// ─── Role → Permission Mapping ────────────────────────────────────────────

type RolePerms = Record<string, string[]>

const ROLE_PERMISSIONS: RolePerms = {
  // Super Admin: everything
  SUPER_ADMIN: ['*'],

  // Country Admin: all read/write except billing and system config
  COUNTRY_ADMIN: [
    '*:read', '*:create', '*:update', '*:export',
    '!settings:admin', '!users:admin',
  ],

  // Tenant Admin: entitled modules + user management
  TENANT_ADMIN: [
    'dashboard:*', 'farmers:*', 'vsla:*', 'marketplace:*',
    'payments:*', 'loans:*', 'reports:*', 'training:*',
    'surveys:*', 'trace:*', 'compliance:*', 'communication:*',
    'input_aggregation:*', 'purchases:*', 'approvals:*',
    'processing:*', 'sales:*', 'deliveries:*', 'consignments:*',
    'companies:read', 'users:*', 'agritrack:*',
    'feedback:*', 'farm_visits:*', 'impact_assessment:*',
    'carbon:*', 'mfi:*', 'transport:*',
    'nssf:*',
  ],

  // ─── EKIBBO-Specific Roles (from EKIBBO requirements Excel) ───

  // EKIBBO Managing Director (Eric): Full access — same as TENANT_ADMIN.
  // NOTE: Marketplace, Payments, Loans, Carbon, MFI, Communication, Feedback and
  // Impact Assessment are NOT part of the Ekibbo product — stripped so this role
  // cannot reach those APIs/menus (separate-tenant separation).
  EKB_MD: [
    'dashboard:*',
    'farmers:*',
    'reports:*',
    'training:*',
    'surveys:*',
    'trace:*',
    'compliance:*',
    'input_aggregation:*',
    'purchases:*',
    'approvals:*',
    'processing:*',
    'sales:*',
    'deliveries:*',
    'consignments:*',
    'companies:read',
    'users:*',
    'agritrack:*',
    'farm_visits:*',
    'transport:*',
    'profile:*',
    'billing:read',
  ],

  // EKIBBO Operations Manager: Manage farmers, groups, trainings, purchases
  EKB_OPS_MANAGER: [
    'dashboard:read',
    'farmers:*',
    'training:*',
    'farm_visits:*',
    'purchases:*', 'purchases:approve',
    'input_aggregation:*',
    'surveys:read',
    'reports:read', 'reports:export',
    'trace:read',
    'compliance:read',
    'profile:read', 'profile:update',
  ],

  // EKIBBO Finance Officer: Financial operations only — NO farmer CRUD
  EKB_FINANCE: [
    'dashboard:read',
    'farmers:read',           // view only — no create/edit
    'purchases:read', 'purchases:approve',
    'sales:*',
    'reports:read', 'reports:export',
    'trace:read',
    'profile:read', 'profile:update',
    'billing:read',
  ],

  // EKIBBO Finance & Operations Assistant: Enter data, draft only — no approvals
  EKB_FIN_ASSISTANT: [
    'dashboard:read',
    'farmers:read',
    'purchases:read', 'purchases:create', 'purchases:update',  // draft only
    'sales:read', 'sales:create', 'sales:update',              // draft only
    'input_aggregation:read', 'input_aggregation:create',
    'profile:read', 'profile:update',
  ],

  // EKIBBO M, E & C Officer: Data quality, reporting, communications — NO financial edits
  EKB_MEC: [
    'dashboard:read',
    'farmers:read', 'farmers:update',   // can correct farmer profiles
    'training:read', 'training:update', // can correct training records
    'farm_visits:read',
    'surveys:*',
    'reports:read', 'reports:export',
    'compliance:read',
    'profile:read', 'profile:update',
  ],

  // EKIBBO Extension Officer: Field data collection — submit only, no edits after submission
  EKB_EXTENSION: [
    'dashboard:read',
    'farmers:read', 'farmers:create',   // register farmers
    'training:read', 'training:create', // record trainings + farm visits
    'farm_visits:read', 'farm_visits:create',
    'purchases:read', 'purchases:create',  // record produce purchases
    'input_aggregation:read', 'input_aggregation:create',  // distribute inputs
    'surveys:read', 'surveys:create',
    'trace:read',
    'compliance:read',
    'profile:read', 'profile:update',
  ],

  // ─── MobiPay Internal Staff (not tenant-scoped) ───

  // MobiPay Finance: Internal finance team — billing, invoices, quotes
  // Does NOT handle support tickets (that's MOBIPAY_SUPPORT).
  MOBIPAY_FINANCE: [
    'dashboard:read',
    'billing:read', 'billing:manage',
    'invoices:read', 'invoices:create', 'invoices:update', 'invoices:export',
    'payments:read',
    'reports:read', 'reports:export',
    'support:read',  // can VIEW tickets but not manage (respond)
    'nssf:read', 'nssf:manage',
    'quotes:read', 'quotes:create', 'quotes:update',
    'profile:read', 'profile:update',
  ],

  // MobiPay Support: Internal support team — handles tenant support tickets
  // Does NOT see billing/financial data (that's MOBIPAY_FINANCE).
  MOBIPAY_SUPPORT: [
    'dashboard:read',
    'support:read', 'support:manage',
    'profile:read', 'profile:update',
  ],

  // ─── Generic Roles (for non-EKIBBO tenants) ───

  // Agent: field data collection
  AGENT: [
    'dashboard:read',
    'farmers:read', 'farmers:create', 'farmers:update',
    'vsla:read', 'vsla:create', 'vsla:update',
    'training:read', 'training:create',
    'surveys:read', 'surveys:create',
    'farm_visits:read', 'farm_visits:create',
    'trace:read',
    'compliance:read',
    'carbon:read',
    'transport:read',
    'profile:read', 'profile:update',
  ],

  // Extension Officer: training delivery, advisory
  EXTENSION_OFFICER: [
    'dashboard:read',
    'farmers:read', 'farmers:create', 'farmers:update',
    'training:*',
    'farm_visits:*',
    'surveys:read',
    'trace:read',
    'compliance:read',
    'carbon:read',
    'transport:read',
    'profile:read', 'profile:update',
  ],

  // CBT (Community Based Trainer): assessment
  CBT: [
    'dashboard:read',
    'training:*',
    'compliance:read', 'compliance:update',
    'farmers:read',
    'surveys:read',
    'profile:read',
  ],

  // Casual worker: minimal
  CASUAL: [
    'dashboard:read',
    'profile:read',
  ],

  // EKIBBO Farmer: self-service (EKIBBO-tenant only)
  // Farmers can view their own produce sales (products/quantities/income),
  // loans, and financial ledger/transactions — scoped to the logged-in farmer.
  EKB_FARMER: [
    'dashboard:read',
    'profile:read', 'profile:update',
    'farmer_ledger:read',
    'sales:read',
    'purchases:read',
    'loans:read',
    'payments:read',
    'training:read',
    'farm_visits:read',
    'marketplace:read',
    'survey_reports:read',
    'feedback:create',
  ],

  // Farmer: self-service
  FARMER: [
    'dashboard:read',
    'profile:read', 'profile:update',
    'marketplace:read', 'marketplace:create',
    'vsla:read',
    'training:read',
    'surveys:read',
    'feedback:create',
  ],

  // VSLA Member: VSLA self-service
  VSLA_MEMBER: [
    'dashboard:read',
    'vsla:read',
    'profile:read', 'profile:update',
    'training:read',
  ],
  // ─── VSLA Provider Admin: full VSLA management on a VSLA_PROVIDER tenant ───
  VSLA_PROVIDER_ADMIN: [
    'dashboard:read',
    'vsla:*',
    'farmers:read', 'farmers:create', 'farmers:update',
    'reports:read', 'reports:export',
    'communication:read', 'communication:create',
    'training:read', 'training:create',
    'surveys:read', 'surveys:create',
    'profile:read', 'profile:update',
    'users:read', 'users:create', 'users:update', 'users:delete',
  ],
  // ─── VSLA V2 Roles (SRS compliant) ───
  // VSLA Officer: Company/tenant field agent who manages groups, assigns key holders,
  // oversees meetings. Can see all VSLA data for their tenant but not other tenants.
  VSLA_OFFICER: [
    'dashboard:read',
    'vsla:*',
    'farmers:read', 'farmers:create', 'farmers:update',
    'training:read', 'training:create',
    'reports:read',
    'profile:read', 'profile:update',
  ],
  // VSLA Key Holder: Group-level officer (Chairperson/Secretary/Treasurer).
  // Can approve/reject loans, view group financials, manage meetings.
  // Cannot create new groups or manage members outside their group.
  VSLA_KEYHOLDER: [
    'dashboard:read',
    'vsla:read', 'vsla:create', 'vsla:update',
    'reports:read',
    'profile:read', 'profile:update',
  ],
  // VSLA E-Teller: Member designated to record transactions at meetings.
  // Can record savings, loans, welfare, fines. Cannot approve loans or manage groups.
  VSLA_ETELLER: [
    'dashboard:read',
    'vsla:read', 'vsla:create',
    'profile:read', 'profile:update',
  ],
  // ─── SACCO Roles (SAA/WFP AMS Project) ───
  SACCO_ADMIN: [
    'dashboard:read',
    'sacco:*',
    'vsla:read',
    'farmers:read', 'farmers:create', 'farmers:update',
    'reports:read', 'reports:export',
    'communication:read', 'communication:create',
    'training:read', 'training:create',
    'profile:read', 'profile:update',
  ],
  SACCO_OFFICER: [
    'dashboard:read',
    'sacco:read', 'sacco:create', 'sacco:update',
    'farmers:read', 'farmers:create', 'farmers:update',
    'reports:read',
    'training:read', 'training:create',
    'profile:read', 'profile:update',
  ],
  // ─── ReSET MarketLink Roles ───
  // Consortium Admin: SCI oversight — sees all partners, all settlements
  CONSORTIUM_ADMIN: [
    'dashboard:*', 'reset:*',
    'vsla:read', 'reports:read',
    'users:*', 'profile:read', 'profile:update',
  ],
  // Partner Admin: Swiss Contact / CARE — sees only their partner's data
  PARTNER_ADMIN: [
    'dashboard:read',
    'reset:read', 'reset:create', 'reset:update',
    'vsla:read',
    'reports:read',
    'profile:read', 'profile:update',
  ],
  // Field Agent: enrolls beneficiaries, onboards merchants, distributes vouchers
  RESET_FIELD_AGENT: [
    'dashboard:read',
    'reset:read', 'reset:create',
    'profile:read', 'profile:update',
  ],
  // Merchant: vendor who accepts vouchers
  RESET_MERCHANT: [
    'dashboard:read',
    'reset:read',
    'profile:read', 'profile:update',
  ],
  // M&E Officer: read-only monitoring
  RESET_ME_OFFICER: [
    'dashboard:read',
    'reset:read',
    'reports:read',
    'profile:read',
  ],
}

/**
 * Check if a role has a specific permission.
 * Handles wildcard expansion (*:read means all modules:read).
 */
export function hasPermission(
  role: string,
  requiredPermission: string
): boolean {
  const perms = ROLE_PERMISSIONS[role]
  if (!perms) return false

  // Super admin wildcard
  if (perms.includes('*')) return true

  // Check exact match
  if (perms.includes(requiredPermission)) return true

  // Parse required permission: "module:action"
  const [reqModule, reqAction] = requiredPermission.split(':')

  // Check for wildcard matches: "module:*" or "*:action"
  for (const perm of perms) {
    if (perm.startsWith('!')) continue // exclusion rule
    const [mod, action] = perm.split(':')
    if (mod === '*' && action === reqAction) return true
    if (action === '*' && mod === reqModule) return true
    if (mod === '*' && action === '*') return true
  }

  // Check exclusions
  for (const perm of perms) {
    if (perm.startsWith('!')) {
      const [, exclPerm] = perm.split('!')
      if (exclPerm === requiredPermission) return false
      const [mod, action] = exclPerm.split(':')
      if (mod === '*' && action === reqAction) return false
      if (action === '*' && mod === reqModule) return false
    }
  }

  return false
}

/**
 * Get all effective permission names for a role.
 */
export function getRolePermissions(role: string): string[] {
  const perms = ROLE_PERMISSIONS[role]
  if (!perms) return []
  if (perms.includes('*')) return ['*:*'] // All permissions
  return perms.filter(p => !p.startsWith('!'))
}

/**
 * Get all modules a role has access to.
 */
export function getRoleModules(role: string): string[] {
  const perms = ROLE_PERMISSIONS[role]
  if (!perms) return []
  if (perms.includes('*')) return [...MODULES]

  const moduleSet = new Set<string>()
  for (const perm of perms) {
    if (perm.startsWith('!')) continue
    const [mod] = perm.split(':')
    if (mod !== '*') moduleSet.add(mod)
  }
  return [...moduleSet]
}

export { ROLE_PERMISSIONS }