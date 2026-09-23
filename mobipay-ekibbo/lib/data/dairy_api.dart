import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';

/// Typed API client for all 29 ZIWA360 dairy endpoints.
///
/// Wraps the generic `ApiClient` (which handles JWT auth, X-Tenant-ID header,
/// and the configurable base URL) and exposes strongly-typed list / get /
/// create / update / delete methods that all dairy screens can call.
///
/// Endpoints follow the convention `/api/dairy/<module-key>`:
///   - GET    /api/dairy/<key>?page=1&limit=20&search=foo
///   - GET    /api/dairy/<key>/<id>
///   - POST   /api/dairy/<key>                 body = {...}
///   - PUT    /api/dairy/<key>/<id>             body = {...}
///   - DELETE /api/dairy/<key>/<id>
///
/// All methods return decoded JSON (`Map<String, dynamic>` or
/// `List<Map<String, dynamic>>`) and throw `DairyApiException` on failure.
class DairyApi {
  DairyApi._();
  static final DairyApi _instance = DairyApi._();
  factory DairyApi() => _instance;

  final ApiClient _http = ApiClient();

  /// Fetch a paginated list of dairy records of module [moduleKey].
  ///
  /// Returns a map containing `data` (the array) + `total` + `page` +
  /// `totalPages` (the backend response shape).
  Future<Map<String, dynamic>> list(
    String moduleKey, {
    int page = 1,
    int limit = 50,
    String search = '',
  }) async {
    final path = '/api/dairy/$moduleKey'
        '?page=$page'
        '&limit=$limit'
        '&search=${Uri.encodeComponent(search)}';
    final res = await _http.get(path);
    if (res.statusCode == 401) {
      throw const DairyApiException(401, 'Session expired');
    }
    if (res.statusCode != 200) {
      throw DairyApiException(
        res.statusCode,
        _extractError(res.body) ?? 'Failed to load $moduleKey',
      );
    }
    final body = jsonDecode(res.body);
    if (body is Map<String, dynamic>) {
      return body;
    }
    // Some endpoints may return a bare list — wrap it.
    if (body is List) {
      return {
        'data': body,
        'total': body.length,
        'page': 1,
        'totalPages': 1,
      };
    }
    return {'data': <Map<String, dynamic>>[], 'total': 0, 'page': 1, 'totalPages': 1};
  }

  /// Fetch one record by id.
  Future<Map<String, dynamic>> getOne(String moduleKey, String id) async {
    final res = await _http.get('/api/dairy/$moduleKey/$id');
    if (res.statusCode == 401) {
      throw const DairyApiException(401, 'Session expired');
    }
    if (res.statusCode != 200) {
      throw DairyApiException(
        res.statusCode,
        _extractError(res.body) ?? 'Failed to load record',
      );
    }
    final body = jsonDecode(res.body);
    if (body is Map<String, dynamic>) {
      return body['data'] is Map
          ? Map<String, dynamic>.from(body['data'] as Map)
          : body;
    }
    return <String, dynamic>{};
  }

  /// Create a new record.
  Future<Map<String, dynamic>> create(
    String moduleKey,
    Map<String, dynamic> body,
  ) async {
    final res = await _http.post('/api/dairy/$moduleKey', body: body);
    if (res.statusCode == 401) {
      throw const DairyApiException(401, 'Session expired');
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw DairyApiException(
        res.statusCode,
        _extractError(res.body) ?? 'Failed to create $moduleKey',
      );
    }
    final decoded = jsonDecode(res.body);
    if (decoded is Map<String, dynamic>) {
      return decoded['data'] is Map
          ? Map<String, dynamic>.from(decoded['data'] as Map)
          : decoded;
    }
    return <String, dynamic>{};
  }

  /// Update an existing record.
  Future<Map<String, dynamic>> update(
    String moduleKey,
    String id,
    Map<String, dynamic> body,
  ) async {
    final res = await _http.put('/api/dairy/$moduleKey/$id', body: body);
    if (res.statusCode == 401) {
      throw const DairyApiException(401, 'Session expired');
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw DairyApiException(
        res.statusCode,
        _extractError(res.body) ?? 'Failed to update $moduleKey',
      );
    }
    final decoded = jsonDecode(res.body);
    if (decoded is Map<String, dynamic>) {
      return decoded['data'] is Map
          ? Map<String, dynamic>.from(decoded['data'] as Map)
          : decoded;
    }
    return <String, dynamic>{};
  }

  /// Delete a record.
  Future<void> remove(String moduleKey, String id) async {
    final res = await _http.delete('/api/dairy/$moduleKey/$id');
    if (res.statusCode == 401) {
      throw const DairyApiException(401, 'Session expired');
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw DairyApiException(
        res.statusCode,
        _extractError(res.body) ?? 'Failed to delete $moduleKey',
      );
    }
  }

  /// Fetch aggregate dashboard KPIs in one round-trip.
  ///
  /// Issues parallel list calls for the modules that drive the 6 KPI tiles
  /// (cows, staff, milking today, tasks pending, vaccinations due in 30 days,
  /// active withdrawals) and aggregates the results.
  Future<Map<String, int>> fetchDashboardKpis() async {
    try {
      final results = await Future.wait([
        list('cows', limit: 1),
        list('staff', limit: 1),
        list('milking', limit: 1),
        list('tasks', limit: 200, search: 'Pending'),
        list('vaccinations', limit: 200),
        list('withdrawals', limit: 200, search: 'Active'),
      ]);
      int totalOf(Map<String, dynamic> r) =>
          (r['total'] as num?)?.toInt() ??
          ((r['data'] as List?)?.length ?? 0);

      final today = DateTime.now();
      final todayStr =
          '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';

      // Vaccinations due in next 30 days (nextDueDate within window).
      int vaxDue = 0;
      try {
        final vaxList = (results[4]['data'] as List?) ?? [];
        final cutoff = today.add(const Duration(days: 30));
        for (final raw in vaxList) {
          if (raw is! Map) continue;
          final dueStr = raw['nextDueDate'];
          if (dueStr == null) continue;
          final due = DateTime.tryParse(dueStr.toString());
          if (due == null) continue;
          if (!due.isBefore(today) && !due.isAfter(cutoff)) {
            vaxDue++;
          }
        }
      } catch (e) {
        debugPrint('[DairyApi] vaxDue calc failed: $e');
      }

      // Today's total milk yield (sum of milking records with today's date).
      double todayMilk = 0;
      try {
        final todayMilking = await list('milking', limit: 200, search: todayStr);
        final milkList = (todayMilking['data'] as List?) ?? [];
        for (final raw in milkList) {
          if (raw is! Map) continue;
          final y = raw['yieldLitres'];
          if (y is num) {
            todayMilk += y.toDouble();
          } else if (y is String) {
            todayMilk += double.tryParse(y) ?? 0;
          }
        }
      } catch (e) {
        debugPrint('[DairyApi] today milk calc failed: $e');
      }

      return {
        'totalCows': totalOf(results[0]),
        'totalStaff': totalOf(results[1]),
        // Today's milk as integer litres (rounded).
        'todayMilkLitres': todayMilk.round(),
        'pendingTasks': totalOf(results[3]),
        'vaccinationsDue': vaxDue,
        'activeWithdrawals': totalOf(results[5]),
      };
    } catch (e) {
      debugPrint('[DairyApi] KPI fetch failed: $e');
      return const {
        'totalCows': 0,
        'totalStaff': 0,
        'todayMilkLitres': 0,
        'pendingTasks': 0,
        'vaccinationsDue': 0,
        'activeWithdrawals': 0,
      };
    }
  }

  String? _extractError(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map && decoded['error'] != null) {
        return decoded['error'].toString();
      }
      if (decoded is Map && decoded['message'] != null) {
        return decoded['message'].toString();
      }
    } catch (_) {
      // body wasn't JSON — return null so the caller falls back to the
      // generic HTTP-status message.
    }
    return null;
  }
}

class DairyApiException implements Exception {
  const DairyApiException(this.statusCode, this.message);
  final int statusCode;
  final String message;

  @override
  String toString() => 'DairyApiException($statusCode): $message';
}
