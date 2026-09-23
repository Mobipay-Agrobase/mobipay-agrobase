import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/data/dairy_api.dart';
import 'package:mobipay_ekibbo/data/dairy_cache.dart';
import 'package:mobipay_ekibbo/data/dairy_modules.dart';

/// Offline-first repository for ZIWA360 dairy data.
///
/// Reads (list / getById):
///   1. If online → fetch from API → replace local cache → return rows.
///   2. If offline OR the API call fails → return rows from the local cache.
///
/// Writes (create / update / delete):
///   1. If online → POST/PUT/DELETE to API → on success upsert/remove in
///      cache → return the resulting record.
///   2. If offline → write to cache (mark dirty) + enqueue the operation in
///      `pending_sync`. When connectivity is restored, `syncPending()` is
///      invoked to replay all queued writes.
///
/// Background sync:
///   - Listens to `Connectivity().onConnectivityChanged`.
///   - On any non-`none` connectivity result → runs `syncPending()`.
///   - Caller should also invoke `syncPending()` on app launch + on the
///     "Sync" button tap.
///
/// Tenant isolation:
///   - This repository is only useful when `ApiClient().tenantId ==
///     'cmucvdj5z000mk1048cmianwy'` (the ZIWA360 tenant id). Callers
///     (dashboard tile, dairy screens) gate access on that check before
///     ever constructing repository calls.
class DairyRepository {
  DairyRepository._();
  static final DairyRepository _instance = DairyRepository._();
  factory DairyRepository() => _instance;

  final DairyApi _api = DairyApi();
  final DairyCache _cache = DairyCache();
  final Connectivity _connectivity = Connectivity();

  StreamSubscription<List<ConnectivityResult>>? _connSub;
  bool _autoSyncRunning = false;

  /// Whether the user is currently on the ZIWA360 tenant.
  bool get isZiwa360Tenant =>
      ApiClient().tenantId == DairyModules.ziwa360TenantId;

  /// Bootstrap the repository. Should be called once on app startup (after
  /// login). Wires up the connectivity listener + kicks off an initial
  /// background sync.
  Future<void> init() async {
    // Ensure the cache (SQLite) is open + all 29 tables exist.
    await _cache.getDatabase();
    _connSub ??= _connectivity.onConnectivityChanged.listen((results) {
      // `results` is a non-empty list since connectivity_plus 5.x.
      final online = results.any((r) => r != ConnectivityResult.none);
      if (online) {
        // Fire-and-forget — failures are swallowed + logged.
        _runAutoSync();
      }
    });
    // Attempt an initial sync in case the app was offline last session.
    unawaited(_runAutoSync());
  }

  /// Tear down listeners (call on logout).
  Future<void> dispose() async {
    await _connSub?.cancel();
    _connSub = null;
  }

  /// Quick connectivity check (single-shot).
  Future<bool> isOnline() async {
    try {
      final results = await _connectivity.checkConnectivity();
      return results.any((r) => r != ConnectivityResult.none);
    } catch (e) {
      debugPrint('[DairyRepository] checkConnectivity failed: $e — assuming online');
      return true;
    }
  }

  // ─── Reads ─────────────────────────────────────────────────────────────────

  /// List rows for [moduleKey]. Tries API first (if online), then falls back
  /// to cache. Always returns whatever data is available.
  Future<List<Map<String, dynamic>>> list(
    String moduleKey, {
    String search = '',
    int page = 1,
    int limit = 50,
    bool forceApi = false,
  }) async {
    final online = await isOnline();
    if (online) {
      try {
        final result = await _api.list(
          moduleKey,
          page: page,
          limit: limit,
          search: search,
        );
        final rawList = (result['data'] as List?) ?? const [];
        final rows = rawList
            .map((e) => e is Map ? Map<String, dynamic>.from(e) : <String, dynamic>{})
            .toList();
        // Replace cache (only when no search filter — otherwise we'd lose rows
        // that don't match the search term).
        if (search.isEmpty && page == 1) {
          await _cache.replaceAll(moduleKey, rows);
        } else if (search.isEmpty) {
          // Subsequent page — upsert each.
          for (final row in rows) {
            await _cache.upsert(moduleKey, row);
          }
        }
        return rows;
      } catch (e) {
        debugPrint('[DairyRepository] list($moduleKey) API failed: $e — falling back to cache');
      }
    } else if (forceApi) {
      // Caller explicitly wanted fresh data but we're offline — surface that.
      debugPrint('[DairyRepository] list($moduleKey) offline — returning cache');
    }
    // Fallback / offline path.
    final cached = await _cache.listAll(moduleKey);
    return _applyInMemorySearch(cached, moduleKey, search);
  }

  /// Get one record by id (tries API, then cache).
  Future<Map<String, dynamic>?> getById(String moduleKey, String id) async {
    final online = await isOnline();
    if (online) {
      try {
        final row = await _api.getOne(moduleKey, id);
        await _cache.upsert(moduleKey, row);
        return row;
      } catch (e) {
        debugPrint('[DairyRepository] getById($moduleKey, $id) API failed: $e — falling back to cache');
      }
    }
    return _cache.getById(moduleKey, id);
  }

  // ─── Writes ───────────────────────────────────────────────────────────────

  /// Create a record. If offline, the row is enqueued for sync.
  Future<Map<String, dynamic>?> create(
    String moduleKey,
    Map<String, dynamic> body,
  ) async {
    final online = await isOnline();
    if (online) {
      try {
        final created = await _api.create(moduleKey, body);
        await _cache.upsert(moduleKey, created);
        return created;
      } catch (e) {
        debugPrint('[DairyRepository] create($moduleKey) API failed: $e — queuing offline');
      }
    }
    // Offline / API-failed path → queue.
    final tempId = _localId();
    final localRow = Map<String, dynamic>.from(body)
      ..['id'] = tempId
      ..['_pending'] = true;
    await _cache.upsert(moduleKey, localRow, dirty: true);
    await _cache.enqueuePending(
      moduleKey: moduleKey,
      recordId: tempId,
      op: PendingOp.insert,
      payload: body,
    );
    return localRow;
  }

  /// Update a record. If offline, the row is enqueued for sync.
  Future<Map<String, dynamic>?> update(
    String moduleKey,
    String id,
    Map<String, dynamic> body,
  ) async {
    final online = await isOnline();
    if (online) {
      try {
        final updated = await _api.update(moduleKey, id, body);
        await _cache.updateRow(moduleKey, id, updated);
        return updated;
      } catch (e) {
        debugPrint('[DairyRepository] update($moduleKey, $id) API failed: $e — queuing offline');
      }
    }
    // Offline path → update cache + enqueue.
    final existing = await _cache.getById(moduleKey, id) ?? {};
    final merged = Map<String, dynamic>.from(existing)
      ..addAll(body)
      ..['_pending'] = true;
    await _cache.upsert(moduleKey, merged, dirty: true);
    await _cache.enqueuePending(
      moduleKey: moduleKey,
      recordId: id,
      op: PendingOp.update,
      payload: body,
    );
    return merged;
  }

  /// Delete a record. If offline, the delete is enqueued for sync.
  Future<void> remove(String moduleKey, String id) async {
    final online = await isOnline();
    if (online) {
      try {
        await _api.remove(moduleKey, id);
        await _cache.deleteRow(moduleKey, id);
        return;
      } catch (e) {
        debugPrint('[DairyRepository] remove($moduleKey, $id) API failed: $e — queuing offline');
      }
    }
    // Offline path → cache + queue.
    await _cache.deleteRow(moduleKey, id);
    await _cache.enqueuePending(
      moduleKey: moduleKey,
      recordId: id,
      op: PendingOp.delete,
    );
  }

  // ─── Sync engine ──────────────────────────────────────────────────────────

  /// Replay every queued write. Should be invoked when connectivity is
  /// restored, on app launch, and on the "Sync" button tap.
  ///
  /// Returns the number of operations successfully replayed.
  Future<int> syncPending() async {
    return _runAutoSync(force: true);
  }

  Future<int> _runAutoSync({bool force = false}) async {
    if (_autoSyncRunning) return 0;
    _autoSyncRunning = true;
    try {
      if (!force) {
        final online = await isOnline();
        if (!online) return 0;
      }
      final pending = await _cache.listPending();
      if (pending.isEmpty) return 0;
      int success = 0;
      for (final item in pending) {
        try {
          switch (item.op) {
            case PendingOp.insert:
              final payload = item.payload ?? const {};
              final created = await _api.create(item.moduleKey, payload);
              final newId = (created['id'] ?? created['_id'])?.toString();
              // Remove the temp row + insert the real one.
              await _cache.deleteRow(item.moduleKey, item.recordId);
              await _cache.upsert(item.moduleKey, created);
              if (newId == null || newId.isEmpty) {
                debugPrint('[DairyRepository] insert sync: created row has no id');
              }
              break;
            case PendingOp.update:
              if (item.payload == null) break;
              await _api.update(item.moduleKey, item.recordId, item.payload!);
              await _cache.upsert(item.moduleKey, item.payload!);
              break;
            case PendingOp.delete:
              await _api.remove(item.moduleKey, item.recordId);
              // Row was already removed locally; nothing else to do.
              break;
          }
          await _cache.dequeuePending(item.id);
          success++;
        } catch (e) {
          // Stop on first failure so we don't keep retrying against a broken
          // backend; the next sync attempt will pick up from here.
          debugPrint('[DairyRepository] sync $item failed: $e — stopping');
          break;
        }
      }
      debugPrint('[DairyRepository] syncPending: $success/${pending.length} replayed');
      return success;
    } finally {
      _autoSyncRunning = false;
    }
  }

  /// Count of writes still queued in `pending_sync`.
  Future<int> pendingCount() => _cache.pendingCount();

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /// Generate a local (negative-id) placeholder so a freshly-created offline
  /// row can be cached before the API assigns a real CUID. We use a negative
  /// ISO timestamp so collisions across multiple offline creates are unlikely.
  String _localId() {
    final now = DateTime.now().millisecondsSinceEpoch;
    return 'local-$now-${now % 1000}';
  }

  /// Apply an in-memory substring search over cached rows using the module's
  /// declared `searchFields`. Empty search returns all rows.
  List<Map<String, dynamic>> _applyInMemorySearch(
    List<Map<String, dynamic>> rows,
    String moduleKey,
    String search,
  ) {
    if (search.trim().isEmpty) return rows;
    final module = DairyModules.byKey(moduleKey);
    final fields = module?.searchFields ?? const [];
    final needle = search.toLowerCase();
    return rows.where((row) {
      if (fields.isEmpty) {
        // No declared fields → search every string value.
        for (final v in row.values) {
          if (v != null && v.toString().toLowerCase().contains(needle)) {
            return true;
          }
        }
        return false;
      }
      for (final f in fields) {
        final v = row[f];
        if (v != null && v.toString().toLowerCase().contains(needle)) {
          return true;
        }
      }
      return false;
    }).toList();
  }
}
