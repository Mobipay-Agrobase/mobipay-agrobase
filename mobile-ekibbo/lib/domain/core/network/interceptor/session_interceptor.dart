import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// SessionInterceptor — GLOBAL 401 (expired/invalid session) handling.
///
/// WHY THIS EXISTS (real bug, reproduced on a device 2026-09-12):
/// `DioClient` sets `validateStatus: (_) => true`, so a 401 from the server
/// is delivered through `onResponse` as a "successful" response — it is
/// NEVER a `DioException`. Retrofit then parses the 401 body, `data` comes
/// back null, the caller throws `FormatException('… data null')`, and the
/// old per-caller check (`if (e is DioException) … 401`) could never match.
/// Result: an expired token produced a silently broken dashboard instead of
/// a re-login prompt. A token dies in two real ways: (1) its 30-day TTL
/// lapsed, or (2) it is a legacy unsigned token (pre signed-token security
/// fix) that the backend now correctly rejects with 401.
///
/// WHAT IT DOES: on any 401 from a NON-auth endpoint (auth/login endpoints
/// legitimately return 401 for bad credentials and must not wipe anything):
///   1. Wipes the stored session (token + user info) — exactly once, because
///      the dashboard fires several parallel requests that all 401 together.
///   2. Shows "Your session has expired. Please log in again." → OK → Login.
///   3. If the navigator is not mounted yet (background request during app
///      startup), it only wipes the token — the next cold start then routes
///      straight to Login via the SplashScreen session check. No crash.
/// The one-shot guard is reset by `ApiProvider.login()` on every fresh
/// login, so the NEXT expiry (30 days later) shows the dialog again.
/// The server stays authoritative: this is UX recovery, not auth logic.
/// ─────────────────────────────────────────────────────────────────────────
class SessionInterceptor extends InterceptorsWrapper {
  static bool _expiryHandled = false;

  /// Called on fresh login so a future expiry can trigger the dialog again.
  static void reset() => _expiryHandled = false;

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    // validateStatus accepts every code, so 401 arrives HERE, not in onError.
    if (response.statusCode == 401 &&
        !_isAuthPath(response.requestOptions.path)) {
      _handleExpiredSession();
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Defense in depth: if validateStatus is ever changed to throw on 4xx,
    // 401s would arrive here instead — same handling, no behavior gap.
    if (err.response?.statusCode == 401 &&
        !_isAuthPath(err.requestOptions.path)) {
      _handleExpiredSession();
    }
    handler.next(err);
  }

  /// Auth/login endpoints return 401 for WRONG CREDENTIALS — that is not a
  /// session expiry and must never wipe or navigate. (The login call runs on
  /// AgrobaseAuthService's own Dio instance, but this guard keeps the
  /// interceptor safe for any future caller too.)
  bool _isAuthPath(String path) {
    final p = path.toLowerCase();
    return p.contains('/auth/') || p.contains('login');
  }

  void _handleExpiredSession() {
    if (_expiryHandled) return;
    _expiryHandled = true;

    // Wipe FIRST so every reader (splash routing, interceptors, services)
    // sees the session as gone even if the dialog cannot be shown.
    SharedPreferencesProvider.instance.clear();
    debugPrint('[SessionInterceptor] 401 — session expired, stored token wiped');

    Future.microtask(() {
      final context = NavigatorManager.navigatorKey.currentContext;
      if (context == null || !context.mounted) {
        // Navigator not ready (startup/background request). The cleared
        // token already guarantees the login screen on next cold start.
        debugPrint(
            '[SessionInterceptor] navigator unavailable — dialog skipped');
        return;
      }
      DialogHelper.showOkDialog(
        context,
        'Your session has expired. Please log in again.',
        okAction: () {
          NavigatorManager.replacementAndRemoveUntil(RouterName.login);
        },
      );
    });
  }
}
