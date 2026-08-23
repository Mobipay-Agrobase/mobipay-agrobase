/// ─────────────────────────────────────────────────────────────────────────
/// Agrobase Ekibbo — environment & API configuration
///
/// Multi-tenant architecture:
///   The Agrobase backend resolves the CURRENT TENANT from the signed-in
///   user's Bearer token (token payload: userId:role:tenantId:timestamp).
///   The server middleware injects `x-tenant-id` / `x-tenant-scope` headers
///   on every request, so tenant isolation & data visibility are enforced
///   SERVER-SIDE. One tenant can never read another tenant's data — the
///   mobile app cannot override this because the scope is derived from the
///   authenticated token, not from client headers.
///
/// Offline-first:
///   All registry data (farmers, plots, dropdown catalogs) is cached in Hive
///   boxes on-device. Field captures (farmer registrations, purchases, farm
///   visits) created while offline are queued locally and pushed from the
///   "Sync Data" screen when connectivity returns.
/// ─────────────────────────────────────────────────────────────────────────
class EnvConfig {
  static const String _version = "1.0.0";

  // Weather service (independent of the Agrobase backend)
  static const String domainWeather = 'https://api.weatherapi.com/v1';

  /// Agrobase web platform (Next.js API) — PRODUCTION.
  /// Android emulator local-backend testing: --dart-define=AGROBASE_API_BASE=http://10.0.2.2:3000
  static const String domainOrigin = String.fromEnvironment(
    'AGROBASE_API_BASE',
    defaultValue: 'https://mobipay-agrobase.vercel.app',
  );

  /// Main Agrobase API — all tenant-scoped data (farmers, plots, purchases,
  /// trainings, inputs, loans, farm visits, surveys, dashboard).
  static const String domainStream = '$domainOrigin/api';

  /// Uploads & supporting endpoints (same backend).
  static const String domainStreamSupport = domainStream;

  /// Agrobase content service (news, advisory, blog).
  /// Same platform until the content microservice is split out.
  static const String domainContent = '$domainOrigin/api';

  static String version(bool isEnvPro) => isEnvPro ? _version : "$_version dev";
  static String baseUrl(bool isEnvPro) => domainStream;
  static String sellerUrl(bool isEnvPro) => domainContent;
}
