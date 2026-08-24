import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'package:agrobase_ekibbo/domain/config/env_config.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// Ekibbo module CRUD service (Trainings / Farm Visits / Surveys / Loans).
///
/// Backed by /api/mobile/ekibbo-modules — the same web-platform tables the
/// web CRUD uses (Training, FarmVisit, Survey, LoanApplication) — so every
/// record created on mobile appears on the web and vice-versa.
///
/// All calls are tenant-scoped by the Bearer token the server decodes.
/// ─────────────────────────────────────────────────────────────────────────
class ApiEkibboModules {
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

  /// Generic GET. Returns the `data` field on success, null otherwise.
  static Future<dynamic> _get(String type, {int? id}) async {
    try {
      final qp = <String, dynamic>{'type': type};
      if (id != null) qp['id'] = id;
      final res = await _dio().get('/mobile/ekibbo-modules', queryParameters: qp);
      if (res.statusCode == 200 && res.data['result'] == true) {
        return res.data['data'];
      }
      if (res.statusCode == 404) throw _moduleError(res);
      return null;
    } on DioException catch (e) {
      debugPrint('ApiEkibboModules._get($type) dio error: ${e.message}');
      return null;
    }
  }

  static String _moduleError(Response res) {
    final msg = res.data is Map ? (res.data['message'] ?? '') : '';
    return msg.toString().isNotEmpty ? msg.toString() : 'Request failed';
  }

  /// List rows of a module type ('trainings'|'farm-visits'|'surveys'|'loans').
  static Future<List<Map<String, dynamic>>> list(String type) async {
    final data = await _get(type);
    if (data is List) return data.cast<Map<String, dynamic>>();
    return [];
  }

  /// Detail of one row (numeric id) — full fields for edit pre-fill.
  static Future<Map<String, dynamic>?> detail(String type, int id) async {
    try {
      final data = await _get(type, id: id);
      if (data is Map<String, dynamic>) return data;
    } catch (e) {
      debugPrint('ApiEkibboModules.detail($type, $id): $e');
      rethrow;
    }
    return null;
  }

  /// Active loan products for the loan form dropdown.
  static Future<List<Map<String, dynamic>>> loanProducts() async {
    final data = await _get('loan-products');
    if (data is List) return data.cast<Map<String, dynamic>>();
    return [];
  }

  /// Create a row. Throws with the server message on failure.
  static Future<bool> create(String type, Map<String, dynamic> body) async {
    final res = await _dio().post(
      '/mobile/ekibbo-modules',
      queryParameters: {'type': type},
      data: body,
    );
    if (res.statusCode == 200 && res.data['result'] == true) return true;
    throw Exception(_moduleError(res));
  }

  /// Update a row (numeric id). Throws with the server message on failure.
  static Future<bool> update(String type, int id, Map<String, dynamic> body) async {
    final res = await _dio().put(
      '/mobile/ekibbo-modules',
      queryParameters: {'type': type, 'id': id},
      data: body,
    );
    if (res.statusCode == 200 && res.data['result'] == true) return true;
    throw Exception(_moduleError(res));
  }

  /// Delete a row (numeric id). Throws with the server message on failure.
  static Future<bool> delete(String type, int id) async {
    final res = await _dio().delete(
      '/mobile/ekibbo-modules',
      queryParameters: {'type': type, 'id': id},
    );
    if (res.statusCode == 200 && res.data['result'] == true) return true;
    throw Exception(_moduleError(res));
  }

  /// Enroll a farmer in a training.
  static Future<bool> enrollFarmer(int trainingId, int farmerId) async {
    final res = await _dio().post(
      '/mobile/ekibbo-modules',
      queryParameters: {'type': 'training-attendance'},
      data: {'training_id': trainingId, 'farmer_id': farmerId},
    );
    if (res.statusCode == 200 && res.data['result'] == true) return true;
    throw Exception(_moduleError(res));
  }
}
