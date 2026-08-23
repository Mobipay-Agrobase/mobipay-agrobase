import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'package:agrobase_ekibbo/domain/config/env_config.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// OTA Data Cache — catalog + geo hierarchy cached in SharedPreferences and
/// refreshed from the web platform:
///   · on app start
///   · when connectivity is regained
///   · pull-to-refresh on dropdown screens
///
/// The cached values are the SAME CatalogMaster / Location-Master rows the
/// web platform serves, so mobile dropdowns always match the web dropdowns.
/// ─────────────────────────────────────────────────────────────────────────
class OtaCacheService {
  OtaCacheService._();
  static final OtaCacheService instance = OtaCacheService._();

  static const _catalogKey = 'ota_catalog';
  static const _catalogSyncedAtKey = 'ota_catalog_synced_at';
  static const _geoSyncedAtKey = 'ota_geo_synced_at';

  Dio? _dio;

  /// category → [{value,label}]
  Map<String, List<Map<String, String>>> _catalog = {};
  DateTime? _catalogSyncedAt;

  Map<String, List<Map<String, String>>> get catalog => _catalog;
  DateTime? get catalogSyncedAt => _catalogSyncedAt;

  void init() {
    _dio ??= Dio(BaseOptions(
      baseUrl: EnvConfig.domainStream,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      validateStatus: (s) => true,
      headers: {
        'Authorization': 'Bearer ${SharedPreferencesProvider.instance.accessToken}',
        'x-app-client': 'agrobase-ekibbo-flutter',
      },
    ));
    _loadCached();
  }

  void _loadCached() {
    try {
      final raw = SharedPreferencesProvider.instance.getString(_catalogKey);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw) as Map<String, dynamic>;
        _catalog = decoded.map((k, v) => MapEntry(
              k,
              (v as List)
                  .map((e) => {
                        'value': (e as Map)['value']?.toString() ?? '',
                        'label': e['label']?.toString() ?? '',
                      })
                  .toList(),
            ));
        _catalogSyncedAt = DateTime.tryParse(
                SharedPreferencesProvider.instance.getString(_catalogSyncedAtKey) ?? '') ??
            null;
        debugPrint('[OTA] catalog loaded from cache: ${_catalog.length} categories');
      }
    } catch (e) {
      debugPrint('[OTA] cache load error: $e');
    }
  }

  /// Pull the latest catalog from the web platform (OTA update).
  Future<bool> refreshCatalog() async {
    try {
      final res = await _dio!.get('/mobile/ekibbo-catalog');
      if (res.statusCode != 200 || res.data['result'] != true) return false;
      final data = res.data['data'] as Map<String, dynamic>;
      _catalog = data.map((k, v) => MapEntry(
            k,
            (v as List)
                .map((e) => {
                      'value': (e as Map)['value']?.toString() ?? '',
                      'label': e['label']?.toString() ?? '',
                    })
                .toList(),
          ));
      _catalogSyncedAt = DateTime.now();
      // persist
      SharedPreferencesProvider.instance.setString(_catalogKey, jsonEncode(data));
      SharedPreferencesProvider.instance.setString(
          _catalogSyncedAtKey, _catalogSyncedAt!.toIso8601String());
      debugPrint('[OTA] catalog refreshed: ${_catalog.length} categories');
      return true;
    } catch (e) {
      debugPrint('[OTA] catalog refresh error: $e');
      return false;
    }
  }

  /// Values for a category (cached, never blocks the UI).
  List<String> categoryValues(String category) {
    final items = _catalog[category] ?? [];
    return items.map((e) => e['value'] ?? '').where((v) => v.isNotEmpty).toList();
  }

  /// Labels for a category (falls back to values).
  List<String> categoryLabels(String category) {
    final items = _catalog[category] ?? [];
    return items.map((e) => e['label']?.isNotEmpty == true ? e['label']! : (e['value'] ?? '')).toList();
  }
}
