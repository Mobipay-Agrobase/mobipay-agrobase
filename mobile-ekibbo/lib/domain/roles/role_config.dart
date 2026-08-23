/// ─────────────────────────────────────────────────────────────────────────
/// Agrobase Ekibbo — role configuration
///
/// Maps Agrobase web-platform roles onto the mobile app's role model:
///   EKB_EXTENSION  → Field Officer (staff) — registers farmers, records
///                    purchases, trainings, inputs, loans, farm visits
///   EKB_FARMER     → Farmer self-service
///
/// The role travels inside the signed-in Bearer token; the backend derives
/// tenant scope from it, so menu visibility here is UX only — data access
/// is always enforced server-side per tenant.
/// ─────────────────────────────────────────────────────────────────────────
enum EnumUserRole {
  super_admin,
  staff, // Field Officer / Extension Officer
  farmer,
  boat_owner,
  warehouse_operator,
  none
}

final mapUserRole = {
  EnumUserRole.super_admin: "super admin",
  EnumUserRole.staff: 'extension officer',
  EnumUserRole.farmer: "farmer",
  EnumUserRole.boat_owner: "boat owner",
  EnumUserRole.warehouse_operator: "warehouse operator"
};

/// Roles as the Agrobase backend reports them (User.role).
const kRoleExtensionOfficer = 'EKB_EXTENSION';
const kRoleFarmer = 'EKB_FARMER';
const kRoleTenantAdmin = 'TENANT_ADMIN';
const kRoleSuperAdmin = 'SUPER_ADMIN';

EnumUserRole stringToRoleUser(String value) {
  switch (value.toLowerCase()) {
    case 'super_admin':
    case 'super admin':
      return EnumUserRole.super_admin;
    case 'ekb_extension':
    case 'extension_officer':
    case 'extension officer':
    case 'staff':
      return EnumUserRole.staff;
    case 'ekb_farmer':
    case 'farmer':
      return EnumUserRole.farmer;
    case 'boat_owner':
    case 'boat owner':
      return EnumUserRole.boat_owner;
    case 'ekb_ops_manager':
    case 'tenant_admin':
    case 'tenant admin':
      return EnumUserRole.super_admin;
    case 'warehouse_operator':
    case 'warehouse operator':
      return EnumUserRole.warehouse_operator;
    default:
      return EnumUserRole.none;
  }
}
