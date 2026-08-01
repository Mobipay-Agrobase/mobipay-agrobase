/**
 * VSLA V2 API Service — Mobile
 * Handles all V2 API calls including SMS OTP login
 */
import 'dart:convert';
import 'package:http/http.dart' as http;

class VslaV2Api {
  // For Android emulator: use http://10.0.2.2:3000 (maps to host's localhost)
  // For iOS simulator: use http://localhost:3000
  // For physical device: use your computer's LAN IP (e.g. http://192.168.1.100:3000)
  // For production: use your Vercel URL (e.g. https://mobipay-agrobase.vercel.app)
  // Override with: flutter run --dart-define=API_BASE_URL=https://your-url.com
  static const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  static String? _memberToken;

  static void setMemberToken(String token) {
    _memberToken = token;
  }

  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    if (_memberToken != null) 'Authorization': 'Bearer $_memberToken',
  };

  /// Step 1: Send OTP — verify member ID + PIN, get OTP sent via SMS
  static Future<Map<String, dynamic>> loginOtp(String memberId, String pin) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/vsla-v2/members/login-otp'),
      headers: headers,
      body: jsonEncode({'memberId': memberId, 'pin': pin}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) {
      throw Exception(data['error'] ?? 'Login failed');
    }
    return data;
  }

  /// Step 2: Verify OTP — complete login, get session token
  static Future<Map<String, dynamic>> verifyOtp(String memberId, String otp) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/vsla-v2/members/verify-otp'),
      headers: headers,
      body: jsonEncode({'memberId': memberId, 'otp': otp}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) {
      throw Exception(data['error'] ?? 'OTP verification failed');
    }
    _memberToken = data['token'];
    return data;
  }

  /// Get member info
  static Future<Map<String, dynamic>> getMemberInfo(String memberId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/vsla-v2/members?memberId=$memberId'),
      headers: headers,
    );
    return jsonDecode(res.body);
  }

  /// Check loan eligibility
  static Future<Map<String, dynamic>> checkEligibility(String groupId, String memberId, double amount) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/vsla-v2/loan/eligibility-check'),
      headers: headers,
      body: jsonEncode({'groupId': groupId, 'memberId': memberId, 'amount': amount}),
    );
    return jsonDecode(res.body);
  }

  /// Apply for loan
  static Future<Map<String, dynamic>> applyForLoan(String groupId, String memberId, double amount, String purpose, {int termDays = 90}) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/vsla-v2/loan/apply'),
      headers: headers,
      body: jsonEncode({'groupId': groupId, 'memberId': memberId, 'amount': amount, 'purpose': purpose, 'termDays': termDays}),
    );
    return jsonDecode(res.body);
  }

  /// Record cashbox entry (E-Teller action)
  static Future<Map<String, dynamic>> recordCashboxEntry(String groupId, String type, double amount, {String? memberId, String? meetingId, String? description, required String recordedByName}) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/vsla-v2/cashbox/$groupId/entry'),
      headers: headers,
      body: jsonEncode({
        'type': type,
        'amount': amount,
        'memberId': memberId,
        'meetingId': meetingId,
        'description': description,
        'recordedByName': recordedByName,
      }),
    );
    return jsonDecode(res.body);
  }
}
