import 'package:agrobase_ekibbo/domain/roles/role_config.dart';
import 'package:agrobase_ekibbo/models/user/user_model.dart';
import 'package:dio/dio.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// Agrobase authentication service
///
/// Bridges the app's login flow to the Agrobase web platform:
///   POST /api/auth/mobile-login  { email | phone, password }
///   → { token, expiresAt, user: { id, email, phone, name, role, tenantId } }
///
/// The returned `token` is an HMAC-SHA256 SIGNED token:
///   `<base64url({userId, role, tenantId, issuedAt, expiresAt})>.<signature>`
/// (opaque to this client — role/tenantId come from the `user` object, and
/// only the server can verify the signature). `expiresAt` (epoch ms) is
/// stored so the app can detect a lapsed session at startup and route to
/// Login without firing doomed requests. Every subsequent API call sends
/// the token as `Authorization: Bearer <token>`; the backend middleware
/// verifies signature + expiry, injects `x-tenant-id` / `x-tenant-scope`
/// and enforces tenant isolation on ALL /api routes. Tenants therefore can
/// never read each other's data regardless of what the client does.
/// ─────────────────────────────────────────────────────────────────────────
class AgrobaseAuthResult {
  final String token;
  final UserModel user;
  /// Epoch-ms expiry reported by the login endpoint (matches the token's
  /// own 30-day TTL). 0 when the server omits it (older deployments).
  final int tokenExpiresAt;
  AgrobaseAuthResult(
      {required this.token, required this.user, this.tokenExpiresAt = 0});
}

class AgrobaseAuthService {
  AgrobaseAuthService._();
  static final AgrobaseAuthService instance = AgrobaseAuthService._();

  late Dio _dio;

  void init({required String baseUrl}) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      validateStatus: (status) => true,
      headers: {'Content-Type': 'application/json'},
    ));
  }

  /// Login with phone number (or email) + password against the Agrobase
  /// platform. Throws [AgrobaseAuthException] with a user-friendly message.
  Future<AgrobaseAuthResult> login({
    required String phoneOrEmail,
    required String password,
  }) async {
    try {
      // Normalize: if the input looks like a phone number (digits, no @),
      // prepend +256 (Uganda) when no country code is present — officers
      // shouldn't have to type +256 every time.
      var normalized = phoneOrEmail.trim();
      final isPhone = RegExp(r'^\d').hasMatch(normalized) && !normalized.contains('@');
      if (isPhone && !normalized.startsWith('+')) {
        // strip leading 0 if present, prepend +256
        normalized = normalized.replaceFirst(RegExp(r'^0'), '');
        normalized = '+256$normalized';
      }
      final res = await _dio.post(
        '/auth/mobile-login',
        data: {'email': normalized, 'password': password},
      );

      if (res.statusCode == 401) {
        throw AgrobaseAuthException('Phone number or password is incorrect');
      }
      if (res.statusCode != 200) {
        final msg = res.data is Map ? (res.data['error'] as String? ?? '') : '';
        throw AgrobaseAuthException(
            msg.isNotEmpty ? msg : 'Login failed (${res.statusCode})');
      }

      final data = res.data as Map<String, dynamic>;
      final token = data['token'] as String? ?? '';
      final tokenExpiresAt = (data['expiresAt'] as num?)?.toInt() ?? 0;
      final userJson = data['user'] as Map<String, dynamic>? ?? {};

      if (token.isEmpty || userJson.isEmpty) {
        throw AgrobaseAuthException('Login response was invalid');
      }

      final user = UserModel.fromJson(userJson);
      if (user.roleUser == EnumUserRole.none) {
        throw AgrobaseAuthException(
            'Your account role (${user.type}) has no mobile access yet. Contact your administrator.');
      }

      return AgrobaseAuthResult(
          token: token, user: user, tokenExpiresAt: tokenExpiresAt);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.connectionError) {
        throw AgrobaseAuthException(
            'Cannot reach the Agrobase server. Check your internet connection.');
      }
      throw AgrobaseAuthException('Network error: ${e.message}');
    } on AgrobaseAuthException {
      rethrow;
    } catch (e) {
      throw AgrobaseAuthException('Login failed: $e');
    }
  }
}

class AgrobaseAuthException implements Exception {
  final String message;
  AgrobaseAuthException(this.message);
  @override
  String toString() => message;
}
