import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:http_parser/http_parser.dart';
import 'package:mime/mime.dart';

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

  /// Farmer groups for the training scheduling dropdown (Ekibbo feedback).
  /// Row shape: {id, name, group_code, location, farmer_count}
  static Future<List<Map<String, dynamic>>> farmerGroups() async {
    final data = await _get('farmer-groups');
    if (data is List) return data.cast<Map<String, dynamic>>();
    return [];
  }

  /// Mark a farmer attended/absent on a training (Reporting flow).
  static Future<bool> markAttendance(int trainingId, int farmerId, {bool attended = true}) async {
    final res = await _dio().put(
      '/mobile/ekibbo-modules',
      queryParameters: {'type': 'training-attendance'},
      data: {
        'training_id': trainingId,
        'farmer_id': farmerId,
        'attended': attended,
      },
    );
    if (res.statusCode == 200 && res.data['result'] == true) return true;
    throw Exception(_moduleError(res));
  }

  // ─── Attachments (EKiBBO reporting: photos + attendance form) ───────────
  // Uses the same /api/attachments endpoints as the web platform, so files
  // uploaded from mobile are visible on web and vice-versa. The middleware
  // accepts the mobile Bearer token on these routes.

  /// Long-timeout Dio for uploads (field connections can be slow).
  static Dio _uploadDio() {
    return Dio(BaseOptions(
      baseUrl: EnvConfig.domainStream,
      connectTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(minutes: 3),
      receiveTimeout: const Duration(minutes: 3),
      validateStatus: (s) => true,
      headers: {
        'Authorization': 'Bearer ${SharedPreferencesProvider.instance.accessToken}',
        'x-app-client': 'agrobase-ekibbo-flutter',
      },
    ));
  }

  /// Upload one file (photo / scanned attendance form) linked to a record.
  /// Mirrors the web limit: images & PDF only, max 5 MB.
  static Future<Map<String, dynamic>> uploadAttachment(
    String filePath, {
    required String relatedId,
    required String relatedType,
    String? description,
  }) async {
    final file = File(filePath);
    if (!await file.exists()) {
      throw Exception('Selected file is no longer available');
    }
    final size = await file.length();
    const maxBytes = 5 * 1024 * 1024;
    if (size > maxBytes) {
      throw Exception('File too large (max 5 MB)');
    }
    final mime = lookupMimeType(filePath) ?? 'application/octet-stream';
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'application/pdf',
    ];
    if (!allowed.contains(mime)) {
      throw Exception('Images and PDF only');
    }

    final fileName = filePath.split(Platform.pathSeparator).last;
    final form = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        filePath,
        filename: fileName,
        contentType: MediaType.parse(mime),
      ),
      'relatedId': relatedId,
      'relatedType': relatedType,
      'description': description ?? '',
    });

    final res = await _uploadDio().post('/attachments/upload', data: form);
    if ((res.statusCode == 200 || res.statusCode == 201) &&
        res.data is Map &&
        res.data['data'] is Map) {
      return (res.data['data'] as Map).cast<String, dynamic>();
    }
    throw Exception(_attachmentError(res));
  }

  /// List attachments linked to a record (newest first). Bounded to 20
  /// rows to keep the data-URI payload sane on field connections.
  static Future<List<Map<String, dynamic>>> listAttachments(
    String relatedType,
    String relatedId,
  ) async {
    final res = await _dio().get(
      '/attachments',
      queryParameters: {
        'relatedType': relatedType,
        'relatedId': relatedId,
        'limit': 20,
      },
    );
    if (res.statusCode == 200 &&
        res.data is Map &&
        res.data['data'] is List) {
      return (res.data['data'] as List)
          .whereType<Map>()
          .map((m) => m.cast<String, dynamic>())
          .toList();
    }
    throw Exception(_attachmentError(res));
  }

  /// Delete an attachment by its id. Throws with the server message.
  static Future<bool> deleteAttachment(String id) async {
    final res = await _dio().delete(
      '/attachments',
      queryParameters: {'id': id},
    );
    if (res.statusCode == 200) return true;
    throw Exception(_attachmentError(res));
  }

  static String _attachmentError(Response res) {
    if (res.data is Map) {
      final msg = (res.data['error'] ?? res.data['message'] ?? '').toString();
      if (msg.isNotEmpty) return msg;
    }
    return 'Request failed (HTTP ${res.statusCode})';
  }
}
