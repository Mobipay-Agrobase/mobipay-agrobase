import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
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
  String? _tenantName;     // Kilimo / EKiBBO / ZIWA360 / etc.
  String? _userRole;       // EXTENSION_OFFICER / TENANT_ADMIN / etc.
  String? _userId;         // for /api/farmers (enrolledByOfficerId scoping)
  String? _userName;      // for display in drawer header

  bool get isAuthenticated => _token != null;
  String? get tenantId => _tenantId;
  String? get tenantName => _tenantName;
  String? get token => _token;
  String? get userRole => _userRole;
  String? get userId => _userId;
  String? get userName => _userName;

  /// True when the logged-in user is an EXTENSION_OFFICER on any tenant.
  /// Use this for general extension-officer UI affordances.
  bool get isExtensionOfficer => _userRole == 'EXTENSION_OFFICER';

  /// True when the logged-in user is an NSSF extension officer — i.e. on the
  /// Klimotrust tenant (the NGO that operates NSSF voluntary savings on behalf
  /// of NSSF Uganda). We detect this by checking both the role AND the tenant
  /// name (case-insensitive contains 'klimo' or 'nssf').
  ///
  /// When true, the mobile app shows ONLY the NSSF workflow:
  ///   - Speed-dial: "Enroll Farmer (NSSF)" + "My Farmers" (no Add Farmer / Farm Land / Trainings)
  ///   - Drawer: same — only Enroll Farmer + My Farmers + Profile + Settings + Sign Out
  ///   - "Add Farmer" taps redirect to the NSSF enrollment screen
  bool get isNssfOfficer {
    if (_userRole != 'EXTENSION_OFFICER') return false;
    final name = (_tenantName ?? '').toLowerCase();
    return name.contains('klimo') || name.contains('nssf');
  }

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _tenantId = prefs.getString('tenant_id');
    _tenantName = prefs.getString('tenant_name');
    _userRole = prefs.getString('user_role');
    _userId = prefs.getString('user_id');
    _userName = prefs.getString('user_name');
  }

  void setAuth(String token, String tenantId) {
    _token = token;
    _tenantId = tenantId;
  }

  void setUser({String? role, String? userId, String? name, String? tenantName}) {
    _userRole = role;
    _userId = userId;
    _userName = name;
    _tenantName = tenantName;
  }

  void clearAuth() {
    _token = null;
    _tenantId = null;
    _tenantName = null;
    _userRole = null;
    _userId = null;
    _userName = null;
  }

  Future<void> saveSession(
    String token,
    String tenantId, {
    String? role,
    String? userId,
    String? name,
    String? tenantName,
  }) async {
    _token = token;
    _tenantId = tenantId;
    _userRole = role;
    _userId = userId;
    _userName = name;
    _tenantName = tenantName;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    await prefs.setString('tenant_id', tenantId);
    if (role != null) await prefs.setString('user_role', role);
    if (userId != null) await prefs.setString('user_id', userId);
    if (name != null) await prefs.setString('user_name', name);
    if (tenantName != null) await prefs.setString('tenant_name', tenantName);
  }

  Future<void> clearSession() async {
    _token = null;
    _tenantId = null;
    _tenantName = null;
    _userRole = null;
    _userId = null;
    _userName = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('tenant_id');
    await prefs.remove('tenant_name');
    await prefs.remove('user_role');
    await prefs.remove('user_id');
    await prefs.remove('user_name');
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

  /// Upload files via multipart/form-data.
  ///
  /// Used for training attachment uploads (photos) and could be reused for
  /// farmer photos, ID proofs, etc. [files] is a list of maps shaped like:
  ///   { 'bytes': Uint8List, 'name': String, 'contentType': String }
  ///
  /// [fields] is an optional map of extra form fields sent alongside the
  /// files (e.g. metadata). Returns the final HTTP response once the server
  /// finishes processing the upload.
  Future<http.Response> uploadFiles(
    String path, {
    required List<Map<String, dynamic>> files,
    Map<String, String>? fields,
  }) async {
    final base = await getBaseUrl();
    final uri = Uri.parse('$base$path');
    final request = http.MultipartRequest('POST', uri)
      ..headers.addAll({
        if (_token != null) 'Authorization': 'Bearer $_token',
        if (_tenantId != null) 'X-Tenant-ID': _tenantId!,
      });
    if (fields != null) {
      fields.forEach((k, v) => request.fields[k] = v);
    }
    for (final f in files) {
      final bytes = f['bytes'] as List<int>;
      final name = (f['name'] as String?) ?? 'file';
      final contentTypeStr =
          (f['contentType'] as String?) ?? 'application/octet-stream';
      MediaType? mediaType;
      try {
        mediaType = MediaType.parse(contentTypeStr);
      } catch (_) {
        // Unparseable contentType — fall back to octet-stream.
      }
      request.files.add(http.MultipartFile.fromBytes(
        'files',
        bytes,
        filename: name,
        contentType: mediaType,
      ));
      debugPrint(
          '[API] uploadFiles: $name ($contentTypeStr, ${bytes.length} bytes)');
    }
    final streamed = await request.send();
    final res = await http.Response.fromStream(streamed);
    debugPrint('[API] ← ${res.statusCode} ${res.body.length} bytes (upload)');
    return res;
  }
}
