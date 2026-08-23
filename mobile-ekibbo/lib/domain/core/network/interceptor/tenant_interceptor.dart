import 'package:dio/dio.dart';

import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// TenantInterceptor — labels every outgoing API request with the signed-in
/// user's tenant context.
///
/// MULTI-TENANT SECURITY MODEL
/// ───────────────────────────
/// This interceptor is *advisory only*. Authoritative tenant isolation is
/// enforced by the Agrobase backend: the server decodes the Bearer token
/// (`base64(userId:role:tenantId)`) in middleware, derives the allowed
/// tenant scope, injects `x-tenant-id` / `x-tenant-scope` headers and scopes
/// every Prisma query to that tenant. A malicious client cannot spoof
/// another tenant's data by sending different headers — the server ignores
/// client-supplied tenant headers on authenticated routes.
///
/// The headers sent here simply make debugging and request tracing easier
/// (server logs can correlate requests to tenants).
/// ─────────────────────────────────────────────────────────────────────────
class TenantInterceptor extends InterceptorsWrapper {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final user = SharedPreferencesProvider.instance.userInfo;
    if (user != null) {
      if (user.tenantId.isNotEmpty) {
        options.headers['x-app-tenant-id'] = user.tenantId;
      }
      options.headers['x-app-role'] = user.type;
    }

    // Offline queue marker — lets the backend know this client supports
    // idempotent re-submission of records captured offline.
    options.headers['x-app-client'] = 'agrobase-ekibbo-flutter';

    handler.next(options);
  }
}
