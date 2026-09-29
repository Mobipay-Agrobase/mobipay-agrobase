import 'dart:async';
import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as p;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';

/// NSSF Offline-First Sync Engine
/// ─────────────────────────────────────────────────────────────────────────
///
/// Provides offline-first storage + automatic sync for the NSSF Extension
/// Officer workflow.
///
/// When the officer enrolls a farmer:
///   1. Save to local SQLite (table: nssf_farmers) with sync_status='PENDING'
///   2. Try to POST to /api/farmers immediately (online attempt)
///   3. If online + 201: update local row → sync_status='SYNCED', save serverId
///   4. If offline OR network error: leave local row as PENDING
///   5. Auto-sync runs every 60s when connectivity returns (via Connectivity++)
///
/// Sync history is tracked in the nssf_sync_log table:
///   - synced_at, total_synced, total_failed, errors (JSON)
///
/// The dashboard shows the pending count via countPending().
/// The farmer detail screen shows the sync status via getSyncStatus(farmerId).
///
/// The officer can manually trigger sync from:
///   - Dashboard "Pending Sync" KPI card tap
///   - Sync screen in Settings (drawer)
///   - Pull-to-refresh on the My Farmers list
class NssfSyncEngine {
  static final NssfSyncEngine _instance = NssfSyncEngine._internal();
  factory NssfSyncEngine() => _instance;
  NssfSyncEngine._internal();

  Database? _db;
  StreamSubscription<ConnectivityResult>? _connSub;
  bool _isSyncing = false;

  /// Singleton DB getter — opens + migrates on first call.
  Future<Database> _getDb() async {
    if (_db?.isOpen ?? false) return _db!;
    final dbPath = await p.join(await getDatabasesPathSafe(), 'nssf_offline.db');
    _db = await openDatabase(
      dbPath,
      version: 1,
      onCreate: (db, v) async {
        await db.execute('''
          CREATE TABLE nssf_farmers (
            local_id TEXT PRIMARY KEY,
            server_id TEXT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            nin TEXT,
            value_chains TEXT,
            country TEXT,
            province TEXT,
            district TEXT,
            commune TEXT,
            village_id TEXT,
            village_name TEXT,
            sync_status TEXT NOT NULL DEFAULT 'PENDING',
            sync_error TEXT,
            created_at INTEGER NOT NULL,
            synced_at INTEGER,
            updated_at INTEGER
          )
        ''');
        await db.execute('CREATE INDEX idx_nssf_farmers_status ON nssf_farmers(sync_status)');
        await db.execute('CREATE INDEX idx_nssf_farmers_phone ON nssf_farmers(phone)');
        await db.execute('''
          CREATE TABLE nssf_sync_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            synced_at INTEGER NOT NULL,
            total_synced INTEGER NOT NULL DEFAULT 0,
            total_failed INTEGER NOT NULL DEFAULT 0,
            errors TEXT,
            duration_ms INTEGER
          )
        ''');
        await db.execute('CREATE INDEX idx_sync_log_time ON nssf_sync_log(synced_at DESC)');
      },
    );
    return _db!;
  }

  /// Start listening for connectivity changes. When connectivity returns
  /// (any of WiFi/Ethernet/Mobile), triggers an automatic sync.
  /// Call this from main.dart on app launch.
  void startAutoSync() {
    _connSub?.cancel();
    _connSub = Connectivity().onConnectivityChanged.listen((result) {
      if (result != ConnectivityResult.none) {
        // Network is back — wait 2s for the OS to stabilize, then sync.
        Future.delayed(const Duration(seconds: 2), () => syncNow());
      }
    });
    // Also do an initial sync attempt (in case we're already online at boot).
    Future.delayed(const Duration(seconds: 5), () => syncNow());
  }

  void stopAutoSync() {
    _connSub?.cancel();
    _connSub = null;
  }

  /// Save a farmer locally. Called from the NSSF enrollment screen.
  /// Returns the local_id of the saved row.
  ///
  /// If [trySync] is true (default), immediately attempts to POST to the
  /// server. If online + success, the local row is marked SYNCED + the
  /// server_id is stored. If offline or error, the row stays PENDING.
  Future<String> saveFarmerLocally({
    required String firstName,
    required String lastName,
    required String phone,
    String? nin,
    List<String>? valueChains,
    String? country,
    String? province,
    String? district,
    String? commune,
    String? villageId,
    String? villageName,
    bool trySync = true,
  }) async {
    final db = await _getDb();
    final localId = 'local_${DateTime.now().millisecondsSinceEpoch}_${phone.hashCode.abs()}';
    final now = DateTime.now().millisecondsSinceEpoch;

    await db.insert('nssf_farmers', {
      'local_id': localId,
      'first_name': firstName,
      'last_name': lastName,
      'phone': phone,
      'nin': nin,
      'value_chains': valueChains != null ? jsonEncode(valueChains) : null,
      'country': country,
      'province': province,
      'district': district,
      'commune': commune,
      'village_id': villageId,
      'village_name': villageName,
      'sync_status': 'PENDING',
      'created_at': now,
    });

    if (trySync) {
      await syncNow();
    }
    return localId;
  }

  /// Update a farmer locally (after edit). The row is marked PENDING again
  /// so it gets re-synced via PUT /api/farmers/[id].
  Future<void> updateFarmerLocally({
    required String localId,
    String? serverId,
    String? firstName,
    String? lastName,
    String? phone,
    String? nin,
    List<String>? valueChains,
    String? country,
    String? province,
    String? district,
    String? commune,
    String? villageId,
    String? villageName,
    bool trySync = true,
  }) async {
    final db = await _getDb();
    final updates = <String, dynamic>{
      'updated_at': DateTime.now().millisecondsSinceEpoch,
      'sync_status': 'PENDING',
      'sync_error': null,
    };
    if (firstName != null) updates['first_name'] = firstName;
    if (lastName != null) updates['last_name'] = lastName;
    if (phone != null) updates['phone'] = phone;
    if (nin != null) updates['nin'] = nin;
    if (valueChains != null) updates['value_chains'] = jsonEncode(valueChains);
    if (country != null) updates['country'] = country;
    if (province != null) updates['province'] = province;
    if (district != null) updates['district'] = district;
    if (commune != null) updates['commune'] = commune;
    if (villageId != null) updates['village_id'] = villageId;
    if (villageName != null) updates['village_name'] = villageName;
    await db.update('nssf_farmers', updates, where: 'local_id = ?', whereArgs: [localId]);

    if (trySync) {
      await syncNow();
    }
  }

  /// Delete a farmer locally. If the farmer was already synced, also tries
  /// to DELETE /api/farmers/[id] on the server.
  Future<void> deleteFarmerLocally(String localId, {String? serverId, bool trySync = true}) async {
    final db = await _getDb();
    await db.delete('nssf_farmers', where: 'local_id = ?', whereArgs: [localId]);

    if (trySync && serverId != null && serverId.isNotEmpty) {
      try {
        await ApiClient().delete('/api/farmers/$serverId');
      } catch (_) {
        // Best-effort — server delete failure is OK since we've already removed the local row.
      }
    }
  }

  /// Returns the count of farmers in the local DB that are PENDING sync.
  /// Used by the dashboard "Pending Sync" KPI.
  Future<int> countPending() async {
    final db = await _getDb();
    final result = await db.rawQuery(
      "SELECT COUNT(*) AS cnt FROM nssf_farmers WHERE sync_status = 'PENDING'",
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }

  /// Returns the count of farmers that have been successfully synced.
  Future<int> countSynced() async {
    final db = await _getDb();
    final result = await db.rawQuery(
      "SELECT COUNT(*) AS cnt FROM nssf_farmers WHERE sync_status = 'SYNCED'",
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }

  /// Returns all locally-saved farmers (regardless of sync status).
  /// Used by the My Farmers screen to show BOTH synced + pending farmers.
  /// Pending farmers appear with a "Pending sync" badge.
  Future<List<Map<String, dynamic>>> listAllFarmers() async {
    final db = await _getDb();
    final rows = await db.query('nssf_farmers', orderBy: 'created_at DESC');
    return rows.map((r) {
      final m = Map<String, dynamic>.from(r);
      // Parse value_chains JSON → List<String>
      m['value_chains'] = r['value_chains'] != null
          ? List<String>.from(jsonDecode(r['value_chains'] as String))
          : <String>[];
      return m;
    }).toList();
  }

  /// Returns the sync status of a single farmer ('PENDING', 'SYNCED', 'FAILED').
  /// Used by the Farmer Detail screen to show a sync badge.
  Future<String?> getSyncStatus(String localId) async {
    final db = await _getDb();
    final rows = await db.query(
      'nssf_farmers',
      columns: ['sync_status'],
      where: 'local_id = ?',
      whereArgs: [localId],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return rows.first['sync_status'] as String?;
  }

  /// Returns the last N sync-log entries (most-recent first).
  /// Used by the Sync History screen in Settings.
  Future<List<Map<String, dynamic>>> getSyncHistory({int limit = 50}) async {
    final db = await _getDb();
    return db.query('nssf_sync_log', orderBy: 'synced_at DESC', limit: limit);
  }

  /// Try to sync ALL pending farmers to the server.
  /// Returns the number of farmers successfully synced.
  ///
  /// This is called:
  ///   - Automatically when connectivity returns (via Connectivity+ subscription)
  ///   - Manually by tapping the "Pending Sync" KPI on the dashboard
  ///   - Manually from the Sync screen in Settings
  ///   - After each saveFarmerLocally call
  ///
  /// Idempotent: if already syncing, returns immediately.
  Future<int> syncNow() async {
    if (_isSyncing) return 0;
    _isSyncing = true;
    final startTime = DateTime.now().millisecondsSinceEpoch;
    int synced = 0;
    int failed = 0;
    final errors = <Map<String, dynamic>>[];

    try {
      final db = await _getDb();
      final pending = await db.query(
        'nssf_farmers',
        where: "sync_status = 'PENDING'",
        orderBy: 'created_at ASC',
      );

      for (final row in pending) {
        try {
          final valueChains = row['value_chains'] != null
              ? List<String>.from(jsonDecode(row['value_chains'] as String))
              : <String>[];
          final serverId = row['server_id'] as String?;
          final payload = <String, dynamic>{
            'firstName': row['first_name'],
            'lastName': row['last_name'],
            'phone': row['phone'],
            'nssfNationalId': row['nin'],
            'nationalIdType': row['nin'] != null ? 'National ID' : null,
            'nationalIdNo': row['nin'],
            'nssfValueChains': valueChains,
            'nssfValueChain': valueChains.isNotEmpty ? valueChains.first : null,
            'status': 'ACTIVE',
            'memberType': 'General',
            if (row['country'] != null) 'country': row['country'],
            if (row['province'] != null) 'province': row['province'],
            if (row['district'] != null) 'district': row['district'],
            if (row['commune'] != null) 'commune': row['commune'],
            if (row['village_id'] != null) 'villageId': row['village_id'],
            if (row['village_name'] != null) 'villageName': row['village_name'],
          };

          if (serverId != null && serverId.isNotEmpty) {
            // UPDATE — PUT /api/farmers/[id]
            final res = await ApiClient().put('/api/farmers/$serverId', body: payload);
            if (res.statusCode == 200 || res.statusCode == 204) {
              await db.update(
                'nssf_farmers',
                {
                  'sync_status': 'SYNCED',
                  'synced_at': DateTime.now().millisecondsSinceEpoch,
                  'sync_error': null,
                },
                where: 'local_id = ?',
                whereArgs: [row['local_id']],
              );
              synced++;
            } else {
              await db.update(
                'nssf_farmers',
                {'sync_status': 'FAILED', 'sync_error': 'HTTP ${res.statusCode}: ${res.body}'},
                where: 'local_id = ?',
                whereArgs: [row['local_id']],
              );
              failed++;
              errors.add({'local_id': row['local_id'], 'error': 'HTTP ${res.statusCode}'});
            }
          } else {
            // CREATE — POST /api/farmers
            payload['nssfActivationStatus'] = 'PENDING';
            payload['nssfEnrolledAt'] = DateTime.now().toIso8601String();
            final res = await ApiClient().post('/api/farmers', body: payload);
            if (res.statusCode == 201 || res.statusCode == 200) {
              final d = jsonDecode(res.body);
              final newServerId = (d['id'] ?? d['data']?['id']) as String?;
              await db.update(
                'nssf_farmers',
                {
                  'sync_status': 'SYNCED',
                  'server_id': newServerId,
                  'synced_at': DateTime.now().millisecondsSinceEpoch,
                  'sync_error': null,
                },
                where: 'local_id = ?',
                whereArgs: [row['local_id']],
              );
              synced++;
            } else if (res.statusCode == 409) {
              // Duplicate phone — already on server. Mark as SYNCED with the
              // existing farmer's ID (extracted from the 409 response body).
              try {
                final d = jsonDecode(res.body);
                final existingId = (d['existingFarmer']?['id']) as String?;
                await db.update(
                  'nssf_farmers',
                  {
                    'sync_status': 'SYNCED',
                    'server_id': existingId,
                    'synced_at': DateTime.now().millisecondsSinceEpoch,
                    'sync_error': 'duplicate (already on server)',
                  },
                  where: 'local_id = ?',
                  whereArgs: [row['local_id']],
                );
                synced++;
              } catch (_) {
                failed++;
              }
            } else {
              await db.update(
                'nssf_farmers',
                {'sync_status': 'FAILED', 'sync_error': 'HTTP ${res.statusCode}: ${res.body}'},
                where: 'local_id = ?',
                whereArgs: [row['local_id']],
              );
              failed++;
              errors.add({'local_id': row['local_id'], 'error': 'HTTP ${res.statusCode}'});
            }
          }
        } catch (e) {
          // Network error — leave as PENDING so it gets retried next sync cycle.
          // Don't mark as FAILED (network errors are transient).
          failed++;
          errors.add({'local_id': row['local_id'], 'error': e.toString()});
        }
      }

      // Log the sync result
      await db.insert('nssf_sync_log', {
        'synced_at': startTime,
        'total_synced': synced,
        'total_failed': failed,
        'errors': errors.isNotEmpty ? jsonEncode(errors) : null,
        'duration_ms': DateTime.now().millisecondsSinceEpoch - startTime,
      });
    } finally {
      _isSyncing = false;
    }
    return synced;
  }
}

/// Wrapper to get the database path. On some platforms (e.g. test env),
/// getDatabasesPath may not be available — fall back to a temp dir.
Future<String> getDatabasesPathSafe() async {
  try {
    return await getDatabasesPath();
  } catch (_) {
    return '/tmp';
  }
}
