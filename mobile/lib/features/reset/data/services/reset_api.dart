import 'dart:convert';
import 'package:http/http.dart' as http;

class ResetApi {
  static const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    // Production API by default so release APKs work out of the box.
    // Override for local dev: flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
    defaultValue: 'https://mobipay-agrobase.vercel.app',
  );

  static String? _token;
  static void setToken(String token) => _token = token;

  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  /// Get dashboard stats
  static Future<Map<String, dynamic>> getDashboard() async {
    final res = await http.get(Uri.parse('$baseUrl/api/reset/dashboard'), headers: headers);
    return jsonDecode(res.body);
  }

  /// List beneficiaries
  static Future<Map<String, dynamic>> getBeneficiaries({int page = 1, int limit = 20}) async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/reset/beneficiaries?page=$page&limit=$limit'),
      headers: headers,
    );
    return jsonDecode(res.body);
  }

  /// Enroll beneficiary
  static Future<Map<String, dynamic>> enrollBeneficiary(Map<String, dynamic> data) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/reset/beneficiaries'),
      headers: headers,
      body: jsonEncode(data),
    );
    return jsonDecode(res.body);
  }

  /// List vouchers
  static Future<Map<String, dynamic>> getVouchers({int page = 1}) async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/reset/vouchers?page=$page&limit=20'),
      headers: headers,
    );
    return jsonDecode(res.body);
  }

  /// Issue voucher
  static Future<Map<String, dynamic>> issueVoucher(Map<String, dynamic> data) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/reset/vouchers'),
      headers: headers,
      body: jsonEncode(data),
    );
    return jsonDecode(res.body);
  }

  /// List merchants
  static Future<Map<String, dynamic>> getMerchants({int page = 1}) async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/reset/merchants?page=$page&limit=20'),
      headers: headers,
    );
    return jsonDecode(res.body);
  }

  /// Get reports
  static Future<Map<String, dynamic>> getReports({String? settlement, String? partner}) async {
    final params = <String>[];
    if (settlement != null) params.add('settlement=$settlement');
    if (partner != null) params.add('partner=$partner');
    final queryString = params.isNotEmpty ? '?${params.join('&')}' : '';
    final res = await http.get(
      Uri.parse('$baseUrl/api/reset/reports$queryString'),
      headers: headers,
    );
    return jsonDecode(res.body);
  }

  /// Get batch history
  static Future<Map<String, dynamic>> getBatches() async {
    final res = await http.get(Uri.parse('$baseUrl/api/reset/cash/batch'), headers: headers);
    return jsonDecode(res.body);
  }
}
