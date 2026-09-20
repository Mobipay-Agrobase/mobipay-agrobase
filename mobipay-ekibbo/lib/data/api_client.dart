import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// EKiBBO API client — talks to the Next.js backend at mobipay-agrobase.vercel.app
///
/// Auth: custom /api/auth/mobile-login endpoint returns a JWT (not NextAuth cookies).
/// Token is stored in SharedPreferences + sent as `Authorization: Bearer <token>`
/// on every request. The `X-Tenant-ID` header is sent for tenant-scoped APIs.
class ApiClient {
  static const String _productionBaseUrl = 'https://mobipay-agrobase.vercel.app';
  static const String _compileTimeOverride = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  static String? _runtimeBaseUrl;

  /// Returns the effective base URL.
  /// Priority: compile-time --dart-define > runtime (SharedPreferences) > production.
  static Future<String> getBaseUrl() async {
    if (_compileTimeOverride.isNotEmpty) return _compileTimeOverride;
    if (_runtimeBaseUrl != null) return _runtimeBaseUrl!;
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString('api_base_url');
    if (stored != null && stored.isNotEmpty) {
      _runtimeBaseUrl = stored;
      return stored;
    }
    return _productionBaseUrl;
  }

  /// Allow runtime switching (used by Profile → API Server settings).
  static Future<void> setBaseUrl(String url) async {
    _runtimeBaseUrl = url;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_base_url', url);
  }

  static Future<void> clearBaseUrl() async {
    _runtimeBaseUrl = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('api_base_url');
  }

  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  String? _token;
  String? _tenantId;

  bool get isAuthenticated => _token != null;
  String? get tenantId => _tenantId;
  String? get token => _token;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _tenantId = prefs.getString('tenant_id');
  }

  void setAuth(String token, String tenantId) {
    _token = token;
    _tenantId = tenantId;
  }

  void clearAuth() {
    _token = null;
    _tenantId = null;
  }

  Future<void> saveSession(String token, String tenantId) async {
    _token = token;
    _tenantId = tenantId;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    await prefs.setString('tenant_id', tenantId);
  }

  Future<void> clearSession() async {
    _token = null;
    _tenantId = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('tenant_id');
  }

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
    if (_tenantId != null) 'X-Tenant-ID': _tenantId!,
  };

  Future<http.Response> get(String path) async {
    final base = await getBaseUrl();
    final uri = Uri.parse('$base$path');
    debugPrint('[API] GET $base$path | token=${_token != null ? "yes" : "no"}');
    return http.get(uri, headers: _headers);
  }

  Future<http.Response> post(String path, {Map<String, dynamic>? body}) async {
    final base = await getBaseUrl();
    final uri = Uri.parse('$base$path');
    final bodyStr = body != null ? jsonEncode(body) : null;
    debugPrint('[API] POST $base$path | body=$bodyStr');
    return http.post(uri, headers: _headers, body: bodyStr);
  }

  Future<http.Response> put(String path, {Map<String, dynamic>? body}) async {
    final base = await getBaseUrl();
    final uri = Uri.parse('$base$path');
    return http.put(uri, headers: _headers, body: body != null ? jsonEncode(body) : null);
  }

  Future<http.Response> delete(String path) async {
    final base = await getBaseUrl();
    final uri = Uri.parse('$base$path');
    return http.delete(uri, headers: _headers);
  }
}
