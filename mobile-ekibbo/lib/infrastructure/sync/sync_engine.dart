import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'package:agrobase_ekibbo/domain/config/env_config.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/hivebox_manager/box_farmer.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/ota_cache_service.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/hivebox_manager/box_sync_log.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// Offline Sync Engine
///
/// · Forms saved while OFFLINE queue into Hive (existing flow).
/// · This engine watches connectivity: when the app regains internet it
///   AUTO-SYNCS the queue — no user action needed.
/// · Every attempt is written to a local sync-audit Hive box AND the server
///   writes its own SyncAuditLog row.
/// · Failed items stay in the queue with the error reason, so the Sync
///   screen can show details and offer per-item RE-SYNC.
/// ─────────────────────────────────────────────────────────────────────────
class SyncEngine {
  SyncEngine._();
  static final SyncEngine instance = SyncEngine._();

  Dio? _dio;
  Timer? _watchTimer;
  bool _syncing = false;
  bool _wasOnline = false;

  /// Callback so the UI can refresh after an auto-sync.
  void Function(int synced, int failed)? onAutoSyncComplete;

  bool get isSyncing => _syncing;

  /// CRITICAL: re-read the token on every request — this engine is created
  /// at app start (pre-login) and outlives logins.
  void _auth() {
    _dio?.options.headers['Authorization'] =
        'Bearer ${SharedPreferencesProvider.instance.accessToken}';
    _dio?.options.headers['x-device-id'] =
        SharedPreferencesProvider.instance.deviceId;
  }

  void init() {
    _dio ??= Dio(BaseOptions(
      baseUrl: EnvConfig.domainStream,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 30),
      validateStatus: (s) => true,
      headers: {
        'x-app-client': 'agrobase-ekibbo-flutter',
      },
    ));
    // Connectivity watch: check every 20s; on offline→online transition,
    // auto-sync + OTA-refresh reference data.
    _watchTimer?.cancel();
    _watchTimer = Timer.periodic(const Duration(seconds: 20), (_) => _tick());
    _tick();
  }

  Future<bool> _isOnline() async {
    try {
      _auth();
      final res = await _dio!.get('/mobile/ekibbo-catalog');
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<void> _tick() async {
    if (_syncing) return;
    final online = await _isOnline();
    if (online && !_wasOnline) {
      debugPrint('[SyncEngine] back online — auto-sync + OTA refresh');
      await autoSync();
    }
    _wasOnline = online;
  }

  /// Auto-sync (connectivity regained): push offline queue + OTA refresh.
  Future<void> autoSync() async {
    if (_syncing) return;
    await syncAllQueues(auto: true);
    await _otaRefresh();
  }

  Future<void> _otaRefresh() async {
    try {
      await OtaCacheService.instance.refreshCatalog();
    } catch (e) {
      debugPrint('[SyncEngine] OTA refresh error: $e');
    }
  }

  /// Push the offline farmer queue (all items, or a single localId to retry).
  /// Returns (synced, failed).
  Future<(int, int)> syncAllQueues({bool auto = false, int? onlyLocalId}) async {
    if (_syncing) return (0, 0);
    _syncing = true;
    try {
      final farmers = await _pendingFarmers(onlyLocalId);
      if (farmers.isEmpty) return (0, 0);

      _auth();
      final res = await _dio!.post(
        '/mobile/ekibbo-sync',
        data: {
          'deviceId': SharedPreferencesProvider.instance.deviceId,
          'items': farmers
              .map((f) => {
                    'localId': f['id'],
                    'type': 'farmer',
                    'payload': f,
                  })
              .toList(),
        },
      );

      if (res.statusCode != 200 || res.data['result'] != true) {
        throw Exception(res.data['message'] ?? 'Sync request failed');
      }

      final results = (res.data['results'] as List).cast<Map<String, dynamic>>();
      var synced = 0;
      var failed = 0;
      for (final r in results) {
        final localId = r['localId'] as int;
        if (r['ok'] == true) {
          synced++;
          await BoxFarmer.delete(localId.toString());
          await BoxSyncLog.log(
            localId: localId,
            type: 'farmer',
            status: 'SUCCESS',
            detail: r['updated'] == true ? 'updated' : 'created',
          );
        } else {
          failed++;
          await BoxSyncLog.log(
            localId: localId,
            type: 'farmer',
            status: 'FAILED',
            detail: r['error']?.toString() ?? 'Unknown error',
          );
        }
      }
      if (synced > 0 || failed > 0) {
        onAutoSyncComplete?.call(synced, failed);
      }
      return (synced, failed);
    } catch (e) {
      debugPrint('[SyncEngine] sync error: $e');
      return (0, 0);
    } finally {
      _syncing = false;
    }
  }

  Future<List<Map<String, dynamic>>> _pendingFarmers(int? onlyLocalId) async {
    try {
      final all = await BoxFarmer.getAll();
      var maps = all.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      if (onlyLocalId != null) {
        maps = maps.where((m) => m['id'] == onlyLocalId).toList();
      }
      return maps;
    } catch (e) {
      debugPrint('[SyncEngine] pending farmers error: $e');
      return [];
    }
  }

  /// Server-side audit log (last 100 attempts for this device).
  Future<List<Map<String, dynamic>>> serverAuditLog() async {
    try {
      _auth();
      final res = await _dio!.get(
        '/mobile/ekibbo-sync',
        queryParameters: {
          'deviceId': SharedPreferencesProvider.instance.deviceId,
          'limit': 100,
        },
      );
      if (res.statusCode == 200 && res.data['result'] == true) {
        return (res.data['data'] as List).cast<Map<String, dynamic>>();
      }
    } catch (_) {}
    return [];
  }

  void dispose() {
    _watchTimer?.cancel();
  }
}

/// Convenience JSON helper.
Map<String, dynamic> tryDecode(String? raw) {
  if (raw == null || raw.isEmpty) return {};
  try {
    return jsonDecode(raw) as Map<String, dynamic>;
  } catch (_) {
    return {};
  }
}
