/// EKiBBO user roles — matches the backend `User.role` values.
///
/// The DB has these role strings on the EKiBBO tenant:
///   - SUPER_ADMIN (platform-wide admin, not tenant-specific)
///   - EKB_MD            — Managing Director
///   - EKB_OPS_MANAGER   — Operations Manager
///   - EKB_FINANCE       — Finance Officer
///   - EKB_FIN_ASSISTANT — Finance Assistant
///   - EKB_MEC           — MEC Officer (Monitoring, Evaluation, Compliance)
///   - EKB_EXTENSION     — Field Officer (extension officer / agronomist)
///   - EKB_FARMER        — Farmer (self-service mobile login)
///   - EXTENSION_OFFICER — generic field officer role (used by some non-EKB tenants)
///
/// For the mobile app, we expose only the 3 roles the login screen lets the
/// user pick. The actual role returned by /api/auth/mobile-login determines
/// what dashboard they see.
enum UserRole {
  fieldOfficer,
  farmer,
  admin,
}

extension ExtUserRole on UserRole {
  /// Display title shown in the role dropdown on the login screen.
  String getTitle() {
    switch (this) {
      case UserRole.admin:
        return 'Admin';
      case UserRole.fieldOfficer:
        return 'Field Officer';
      case UserRole.farmer:
        return 'Farmer';
    }
  }

  /// The backend role strings this selection maps to.
  /// Used for client-side gating (which screens to show after login).
  /// The actual auth endpoint accepts email/phone + password and returns
  /// the user's actual role — this is just a hint for the UI.
  List<String> get backendRoles {
    switch (this) {
      case UserRole.fieldOfficer:
        // Both EKB_EXTENSION (EKiBBO-specific) and EXTENSION_OFFICER (generic)
        // are valid field officer roles on the backend.
        return const ['EKB_EXTENSION', 'EXTENSION_OFFICER'];
      case UserRole.farmer:
        return const ['EKB_FARMER', 'FARMER'];
      case UserRole.admin:
        return const [
          'SUPER_ADMIN',
          'EKB_MD',
          'EKB_OPS_MANAGER',
          'EKB_FINANCE',
          'EKB_FIN_ASSISTANT',
          'EKB_MEC',
          'TENANT_ADMIN',
        ];
    }
  }
}
