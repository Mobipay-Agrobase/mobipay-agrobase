import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'package:agrobase_ekibbo/domain/config/env_config.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// Ekibbo profile service — self-service profile update from the app.
///
/// PUT /mobile/ekibbo-profile with {first_name, last_name, phone_number,
/// email}. The server validates (phone is unique platform-wide) and returns
/// the refreshed staff_data envelope, so the caller can update its cached
/// profile without a second GET.
/// ─────────────────────────────────────────────────────────────────────────
class ApiEkibboProfile {
  static Dio _dio() {
    return Dio(BaseOptions(
      baseUrl: EnvConfig.domainStream,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
      validateStatus: (s) => true,
      headers: {
        'Authorization': 'Bearer ${SharedPreferencesProvider.instance.accessToken}',
        'x-app-client': 'agrobase-ekibbo-flutter',
      },
    ));
  }

  /// Update the signed-in officer's profile. Throws with the server message
  /// on failure; returns the raw staff_data map on success.
  static Future<Map<String, dynamic>?> update(
    Map<String, dynamic> body,
  ) async {
    try {
      final res = await _dio().put('/mobile/ekibbo-profile', data: body);
      if (res.statusCode == 200 && res.data['result'] == true) {
        final data = res.data['data'];
        if (data is Map && data['staff_data'] is Map) {
          return Map<String, dynamic>.from(data['staff_data']);
        }
        return <String, dynamic>{};
      }
      final msg = res.data is Map ? (res.data['message'] ?? '') : '';
      throw Exception(
        msg.toString().isNotEmpty ? msg.toString() : 'Failed to update profile',
      );
    } on DioException catch (e) {
      debugPrint('ApiEkibboProfile.update dio error: ${e.message}');
      throw Exception('Network error — please try again');
    }
  }
}
