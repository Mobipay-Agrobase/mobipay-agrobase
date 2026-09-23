import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:sqflite/sqflite.dart';
import 'package:mobipay_ekibbo/data/dairy_modules.dart';

/// Local SQLite cache for ZIWA360 dairy data — offline-first storage.
///
/// Schema design:
///   - One table per dairy module (29 tables), named `dairy_<moduleKey>`.
///     Each table stores the row's `id` (primary key), the full JSON
///     `payload` (so the schema is flexible across API additions), an
///     `updated_at` timestamp, and a `dirty` flag (0 = synced, 1 = local
///     pending sync).
///   - One `pending_sync` queue table holding writes that haven't yet been
///     pushed to the API (created offline). Each row records the module,
///     operation (INSERT/UPDATE/DELETE), the local id, and the JSON payload
///     to send.
///
/// All access methods are defensive against JSON shape drift — they cast with
/// `as num?`, `as List?` etc., so a partial / unknown response never crashes
/// the cache.
class DairyCache {
  DairyCache._();
  static final DairyCache _instance = DairyCache._();
  factory DairyCache() => _instance;

  Database? _db;
  bool _initializing = false;

  /// Open or create the SQLite database. Idempotent + safe to call repeatedly.
  Future<Database> db() async {
    if (_db != null && _db!.isOpen) return _db!;
    if (_initializing) {
      // Another caller is mid-init — busy-wait briefly.
      while (_initializing) {
        await Future<void>.delayed(const Duration(milliseconds: 20));
      }
      return _db!;
    }
    _initializing = true;
    try {
      final dbPath = await _resolveDbPath();
      _db = await openDatabase(
        dbPath,
        version: 1,
        onCreate: (db, version) async {
          for (final module in DairyModules.all) {
            await db.execute('''
              CREATE TABLE IF NOT EXISTS ${module.tableName} (
                id TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                updated_at INTEGER NOT NULL,
                dirty INTEGER NOT NULL DEFAULT 0
              )
            ''');
          }
          await db.execute('''
            CREATE TABLE IF NOT EXISTS pending_sync (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              module TEXT NOT NULL,
              record_id TEXT NOT NULL,
              op TEXT NOT NULL,
              payload TEXT,
              created_at INTEGER NOT NULL
            )
          ''');
        },
      );
      // Best-effort migration: ensure all tables exist (in case the file was
      // created with fewer modules in an earlier version).
      await _ensureTables(_db!);
      return _db!;
    } finally {
      _initializing = false;
    }
  }

  Future<String> _resolveDbPath() async {
    try {
      // sqflite.getDatabasesPath() resolves to the platform-appropriate
      // application documents directory on Android / iOS.
      final dir = await getDatabasesPath();
      return '$dir/ziwa_dairy_cache.db';
    } catch (e) {
      debugPrint('[DairyCache] getDatabasesPath failed: $e — falling back to in-memory');
      return ':memory:';
    }
  }

  Future<void> _ensureTables(Database db) async {
    for (final module in DairyModules.all) {
      await db.execute('''
        CREATE TABLE IF NOT EXISTS ${module.tableName} (
          id TEXT PRIMARY KEY,
          payload TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          dirty INTEGER NOT NULL DEFAULT 0
        )
      ''');
    }
    await db.execute('''
      CREATE TABLE IF NOT EXISTS pending_sync (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module TEXT NOT NULL,
        record_id TEXT NOT NULL,
        op TEXT NOT NULL,
        payload TEXT,
        created_at INTEGER NOT NULL
      )
    ''');
  }

  // ─── Reads ─────────────────────────────────────────────────────────────────

  /// Fetch all cached rows for [moduleKey], newest-first.
  Future<List<Map<String, dynamic>>> listAll(String moduleKey) async {
    final db = await db();
    final module = DairyModules.byKey(moduleKey);
    if (module == null) return const [];
    try {
      final rows = await db.query(
        module.tableName,
        orderBy: 'updated_at DESC',
      );
      return rows.map(_decodePayload).toList();
    } catch (e) {
      debugPrint('[DairyCache] listAll($moduleKey) failed: $e');
      return const [];
    }
  }

  /// Fetch one cached row by id (returns null if missing).
  Future<Map<String, dynamic>?> getById(String moduleKey, String id) async {
    final db = await db();
    final module = DairyModules.byKey(moduleKey);
    if (module == null) return null;
    try {
      final rows = await db.query(
        module.tableName,
        where: 'id = ?',
        whereArgs: [id],
        limit: 1,
      );
      if (rows.isEmpty) return null;
      return _decodePayload(rows.first);
    } catch (e) {
      debugPrint('[DairyCache] getById($moduleKey, $id) failed: $e');
      return null;
    }
  }

  // ─── Writes ───────────────────────────────────────────────────────────────

  /// Upsert one row in the cache (used after a successful API fetch or write).
  Future<void> upsert(
    String moduleKey,
    Map<String, dynamic> row, {
    bool dirty = false,
  }) async {
    final db = await db();
    final module = DairyModules.byKey(moduleKey);
    if (module == null) return;
    final id = (row['id'] ?? row['_id'])?.toString();
    if (id == null || id.isEmpty) {
      debugPrint('[DairyCache] upsert($moduleKey): row has no id — skipping');
      return;
    }
    final now = DateTime.now().millisecondsSinceEpoch;
    try {
      await db.insert(
        module.tableName,
        {
          'id': id,
          'payload': jsonEncode(row),
          'updated_at': now,
          'dirty': dirty ? 1 : 0,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    } catch (e) {
      debugPrint('[DairyCache] upsert($moduleKey, $id) failed: $e');
    }
  }

  /// Bulk replace all cached rows for [moduleKey] (used after a fresh fetch).
  Future<void> replaceAll(
    String moduleKey,
    List<Map<String, dynamic>> rows,
  ) async {
    final db = await db();
    final module = DairyModules.byKey(moduleKey);
    if (module == null) return;
    try {
      await db.transaction((txn) async {
        await txn.delete(module.tableName);
        final now = DateTime.now().millisecondsSinceEpoch;
        for (final row in rows) {
          final id = (row['id'] ?? row['_id'])?.toString();
          if (id == null || id.isEmpty) continue;
          await txn.insert(
            module.tableName,
            {
              'id': id,
              'payload': jsonEncode(row),
              'updated_at': now,
              'dirty': 0,
            },
            conflictAlgorithm: ConflictAlgorithm.replace,
          );
        }
      });
    } catch (e) {
      debugPrint('[DairyCache] replaceAll($moduleKey) failed: $e');
    }
  }

  /// Update one cached row (after a successful PUT).
  Future<void> updateRow(
    String moduleKey,
    String id,
    Map<String, dynamic> row,
  ) async {
    final merged = <String, dynamic>{
      ...row,
      'id': row['id'] ?? id,
    };
    await upsert(moduleKey, merged, dirty: false);
  }

  /// Delete one cached row by id.
  Future<void> deleteRow(String moduleKey, String id) async {
    final db = await db();
    final module = DairyModules.byKey(moduleKey);
    if (module == null) return;
    try {
      await db.delete(
        module.tableName,
        where: 'id = ?',
        whereArgs: [id],
      );
    } catch (e) {
      debugPrint('[DairyCache] deleteRow($moduleKey, $id) failed: $e');
    }
  }

  /// Drop every cached row for [moduleKey] (used on full refresh).
  Future<void> clear(String moduleKey) async {
    final db = await db();
    final module = DairyModules.byKey(moduleKey);
    if (module == null) return;
    try {
      await db.delete(module.tableName);
    } catch (e) {
      debugPrint('[DairyCache] clear($moduleKey) failed: $e');
    }
  }

  /// Wipe all dairy tables + the pending_sync queue (logout / reset).
  Future<void> clearAll() async {
    final db = await db();
    try {
      for (final module in DairyModules.all) {
        await db.delete(module.tableName);
      }
      await db.delete('pending_sync');
    } catch (e) {
      debugPrint('[DairyCache] clearAll failed: $e');
    }
  }

  // ─── Pending sync queue ───────────────────────────────────────────────────

  /// Enqueue a write that should be replayed to the API when connectivity is
  /// restored. Returns the row id assigned by SQLite (or -1 on failure).
  Future<int> enqueuePending({
    required String moduleKey,
    required String recordId,
    required PendingOp op,
    Map<String, dynamic>? payload,
  }) async {
    final db = await db();
    try {
      return await db.insert('pending_sync', {
        'module': moduleKey,
        'record_id': recordId,
        'op': op.name,
        'payload': payload != null ? jsonEncode(payload) : null,
        'created_at': DateTime.now().millisecondsSinceEpoch,
      });
    } catch (e) {
      debugPrint('[DairyCache] enqueuePending failed: $e');
      return -1;
    }
  }

  /// Return all pending sync operations, oldest first.
  Future<List<PendingSyncRow>> listPending() async {
    final db = await db();
    try {
      final rows = await db.query(
        'pending_sync',
        orderBy: 'created_at ASC',
      );
      return rows.map(_pendingFromRow).toList();
    } catch (e) {
      debugPrint('[DairyCache] listPending failed: $e');
      return const [];
    }
  }

  /// Remove one row from the pending queue (after a successful replay).
  Future<void> dequeuePending(int queueId) async {
    final db = await db();
    try {
      await db.delete(
        'pending_sync',
        where: 'id = ?',
        whereArgs: [queueId],
      );
    } catch (e) {
      debugPrint('[DairyCache] dequeuePending($queueId) failed: $e');
    }
  }

  /// Count of pending operations (used by the dashboard banner).
  Future<int> pendingCount() async {
    final db = await db();
    try {
      final rows = await db.rawQuery('SELECT COUNT(*) AS n FROM pending_sync');
      if (rows.isEmpty) return 0;
      final n = rows.first['n'];
      if (n is int) return n;
      if (n is num) return n.toInt();
      return int.tryParse(n.toString()) ?? 0;
    } catch (e) {
      debugPrint('[DairyCache] pendingCount failed: $e');
      return 0;
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  Map<String, dynamic> _decodePayload(Map<String, dynamic> row) {
    final payload = row['payload'];
    if (payload is String) {
      try {
        final decoded = jsonDecode(payload);
        if (decoded is Map) {
          return Map<String, dynamic>.from(decoded);
        }
      } catch (e) {
        debugPrint('[DairyCache] _decodePayload JSON decode failed: $e');
      }
    }
    return <String, dynamic>{'id': row['id']};
  }

  PendingSyncRow _pendingFromRow(Map<String, dynamic> row) {
    final payloadStr = row['payload'] as String?;
    Map<String, dynamic>? payload;
    if (payloadStr != null && payloadStr.isNotEmpty) {
      try {
        final decoded = jsonDecode(payloadStr);
        if (decoded is Map) {
          payload = Map<String, dynamic>.from(decoded);
        }
      } catch (_) {
        payload = null;
      }
    }
    return PendingSyncRow(
      id: (row['id'] as num?)?.toInt() ?? 0,
      moduleKey: row['module']?.toString() ?? '',
      recordId: row['record_id']?.toString() ?? '',
      op: PendingOp.values.firstWhere(
        (e) => e.name == (row['op']?.toString() ?? ''),
        orElse: () => PendingOp.insert,
      ),
      payload: payload,
      createdAt: (row['created_at'] as num?)?.toInt() ?? 0,
    );
  }
}

enum PendingOp { insert, update, delete }

/// One row from the `pending_sync` queue.
class PendingSyncRow {
  const PendingSyncRow({
    required this.id,
    required this.moduleKey,
    required this.recordId,
    required this.op,
    required this.payload,
    required this.createdAt,
  });

  final int id;
  final String moduleKey;
  final String recordId;
  final PendingOp op;
  final Map<String, dynamic>? payload;
  final int createdAt;
}
