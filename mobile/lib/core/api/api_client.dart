import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart' show debugPrint;

class ApiClient {
  /// Hardcoded production API base URL.
  /// Change this for local development (e.g. 'http://10.0.2.2:3000' for Android emulator).
  /// No need to pass --dart-define at runtime — it's baked into the code.
  static const String _productionBaseUrl = 'https://mobipay-agrobase.vercel.app';

  /// Optional compile-time override (for local dev only):
  /// flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
  static const String _compiledBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '', // empty = use _productionBaseUrl
  );

  static String? _runtimeBaseUrl;

  /// Returns the effective base URL.
  /// Priority:
  ///   1. Compile-time: `flutter run --dart-define=API_BASE_URL=http://...`
  ///   2. Runtime: stored in SharedPreferences (set via settings screen)
  ///   3. Default: Vercel production API
  ///
  /// For local dev against a local server:
  ///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
  ///
  /// For local dev against Vercel staging:
  ///   flutter run --dart-define=API_BASE_URL=https://mobipay-agrobase-git-staging.vercel.app
  static Future<String> getBaseUrl() async {
    String url;
    // 1. Compile-time override (for local dev only)
    if (_compiledBaseUrl.isNotEmpty) {
      url = _compiledBaseUrl;
    } else {
      // 2. Runtime override (from SharedPreferences / app settings)
      if (_runtimeBaseUrl != null) {
        url = _runtimeBaseUrl!;
      } else {
        final prefs = await SharedPreferences.getInstance();
        final stored = prefs.getString('api_base_url');
        if (stored != null && stored.isNotEmpty) {
          _runtimeBaseUrl = stored;
          url = stored;
        } else {
          // 3. Hardcoded production URL (no runtime flag needed)
          url = _productionBaseUrl;
        }
      }
    }
    while (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    return url;
  }

  /// Call this from a settings screen to let users configure the server URL.
  static Future<void> setBaseUrl(String url) async {
    _runtimeBaseUrl = url;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_base_url', url);
  }

  /// Clear the runtime override (revert to compile-time or platform default).
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

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
        if (_tenantId != null) 'X-Tenant-ID': _tenantId!,
      };

  Future<http.Response> get(String path) async {
    final base = await getBaseUrl();
    final uri = Uri.parse('$base$path');
    debugPrint('[API] GET $base$path | token=${_token != null ? "yes" : "no"}');
    final res = await http.get(uri, headers: _headers);
    debugPrint('[API] ← ${res.statusCode} ${res.body.length} bytes');
    return res;
  }

  Future<http.Response> post(String path, {Map<String, dynamic>? body}) async {
    final base = await getBaseUrl();
    final uri = Uri.parse('$base$path');
    debugPrint('[API] POST $base$path | token=${_token != null ? "yes" : "no"}');
    final res = await http.post(uri,
        headers: _headers,
        body: body != null ? jsonEncode(body) : null);
    debugPrint('[API] ← ${res.statusCode} ${res.body.length} bytes');
    return res;
  }

  Future<http.Response> put(String path, {Map<String, dynamic>? body}) async {
    final base = await getBaseUrl();
    final uri = Uri.parse('$base$path');
    return http.put(uri,
        headers: _headers,
        body: body != null ? jsonEncode(body) : null);
  }

  Future<http.Response> patch(String path, {Map<String, dynamic>? body}) async {
    final base = await getBaseUrl();
    final uri = Uri.parse('$base$path');
    return http.patch(uri,
        headers: _headers,
        body: body != null ? jsonEncode(body) : null);
  }

  Future<http.Response> delete(String path) async {
    final base = await getBaseUrl();
    final uri = Uri.parse('$base$path');
    return http.delete(uri, headers: _headers);
  }
}