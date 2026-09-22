import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/my_app_bar.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';

/// EKiBBO Sync screen (Screen 16).
///
/// Maintains a local sqflite cache with 3 tables:
///   - farmers_cache (id TEXT PRIMARY KEY, json_data TEXT, cached_at INTEGER)
///   - trainings_cache (id TEXT PRIMARY KEY, json_data TEXT, cached_at INTEGER)
///   - farm_lands_cache (id TEXT PRIMARY KEY, json_data TEXT, cached_at INTEGER)
///
/// Shows one card per table with:
///   - Cached count
///   - Last synced timestamp (persisted in shared_preferences as
///     `sync_${key}_at` epoch ms; falls back to "Never synced")
///   - "Sync Now" button that fetches the API and stores in sqflite
///
/// After sync: shows success snackbar + updated count.
///
/// NOTE: Per task rules, we do NOT modify screens 1-6 (which are the list
/// screens). The cache is populated here for future use by the list screens
/// in a follow-up — they'll read from sqflite when the API fails offline.
class SyncScreen extends StatefulWidget {
  const SyncScreen({super.key});

  @override
  State<SyncScreen> createState() => _SyncScreenState();
}

class _SyncScreenState extends State<SyncScreen> {
  /// Cache table metadata. Each entry drives a card in the UI.
  static const _tables = <_CacheTable>[
    _CacheTable(
      key: 'farmers',
      table: 'farmers_cache',
      labelKey: 'sync_farmers',
      endpoint: '/api/farmers?limit=100&status=all',
      listKey: 'farmers',
      fallbackListKeys: ['farmers', 'data'],
    ),
    _CacheTable(
      key: 'trainings',
      table: 'trainings_cache',
      labelKey: 'sync_trainings',
      endpoint: '/api/trainings?limit=100',
      listKey: 'data',
      fallbackListKeys: ['data', 'trainings'],
    ),
    _CacheTable(
      key: 'farm_lands',
      table: 'farm_lands_cache',
      labelKey: 'sync_farm_lands',
      endpoint: '/api/farm-lands?limit=100',
      listKey: 'farms',
      fallbackListKeys: ['farms', 'farmLands', 'data'],
    ),
  ];

  /// Map<table, count>
  Map<String, int> _counts = <String, int>{};
  /// Map<table, lastSyncedMs?>
  Map<String, int?> _timestamps = <String, int?>{};
  /// Map<table, syncing>
  Map<String, bool> _syncing = <String, bool>{};

  Database? _db;

  @override
  void initState() {
    super.initState();
    _initDbAndLoad();
  }

  Future<Database> _openDb() async {
    if (_db != null) return _db!;
    final dbPath = await getDatabasesPath();
    final path = '$dbPath/ekibbo_cache.db';
    _db = await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute(
          'CREATE TABLE IF NOT EXISTS farmers_cache '
          '(id TEXT PRIMARY KEY, json_data TEXT, cached_at INTEGER)',
        );
        await db.execute(
          'CREATE TABLE IF NOT EXISTS trainings_cache '
          '(id TEXT PRIMARY KEY, json_data TEXT, cached_at INTEGER)',
        );
        await db.execute(
          'CREATE TABLE IF NOT EXISTS farm_lands_cache '
          '(id TEXT PRIMARY KEY, json_data TEXT, cached_at INTEGER)',
        );
      },
    );
    return _db!;
  }

  Future<void> _initDbAndLoad() async {
    try {
      await _openDb();
      await _refreshCounts();
      await _refreshTimestamps();
    } catch (e) {
      // DB open failed — surface as a snackbar; we don't bail out so the
      // user can still see the cards (they'll get an error when they tap
      // "Sync Now").
      debugPrint('[SyncScreen] DB open failed: $e');
    }
  }

  Future<void> _refreshCounts() async {
    if (_db == null) return;
    final counts = <String, int>{};
    for (final t in _tables) {
      try {
        final rows = await _db!
            .rawQuery('SELECT COUNT(*) AS c FROM ${t.table}');
        final v = (rows.isNotEmpty)
            ? (rows.first['c'] as num?)?.toInt() ?? 0
            : 0;
        counts[t.key] = v;
      } catch (e) {
        debugPrint('[SyncScreen] count(${t.table}) failed: $e');
        counts[t.key] = 0;
      }
    }
    if (!mounted) return;
    setState(() => _counts = counts);
  }

  Future<void> _refreshTimestamps() async {
    final prefs = await SharedPreferences.getInstance();
    final ts = <String, int?>{};
    for (final t in _tables) {
      ts[t.key] = prefs.getInt('sync_${t.key}_at');
    }
    if (!mounted) return;
    setState(() => _timestamps = ts);
  }

  Future<void> _handleUnauthorized() async {
    await ApiClient().clearSession();
    ApiClient().clearAuth();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLang.local.session_expired),
        backgroundColor: ColorConstant.danger,
      ),
    );
    navigatorKey.currentState?.pushReplacementNamed(RouterName.login);
  }

  Future<void> _syncTable(_CacheTable t) async {
    if (_db == null) {
      try {
        await _openDb();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${AppLang.local.sync_failed}: $e'),
            backgroundColor: ColorConstant.danger,
          ),
        );
        return;
      }
    }
    if (!mounted) return;
    setState(() => _syncing[t.key] = true);
    try {
      final res = await ApiClient().get(t.endpoint);
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode != 200) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${AppLang.local.sync_failed} (${t.table}: HTTP ${res.statusCode})',
            ),
            backgroundColor: ColorConstant.danger,
          ),
        );
        return;
      }
      final body = jsonDecode(res.body);
      // Resolve list field (may be under `data`, `farmers`, `farms`, etc).
      List<dynamic> list;
      if (body is List) {
        list = body;
      } else if (body is Map) {
        dynamic raw;
        for (final key in t.fallbackListKeys) {
          if (body[key] is List) {
            raw = body[key];
            break;
          }
        }
        list = raw is List ? raw : [];
      } else {
        list = [];
      }
      final now = DateTime.now().millisecondsSinceEpoch;
      // Replace all rows in this table within a transaction.
      await _db!.transaction((txn) async {
        await txn.delete(t.table);
        for (final item in list) {
          if (item is! Map) continue;
          final m = Map<String, dynamic>.from(item);
          final id = _str(m['id'] ?? m['_id']);
          if (id.isEmpty) continue;
          await txn.insert(
            t.table,
            <String, Object?>{
              'id': id,
              'json_data': jsonEncode(m),
              'cached_at': now,
            },
            conflictAlgorithm: ConflictAlgorithm.replace,
          );
        }
      });
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt('sync_${t.key}_at', now);
      await _refreshCounts();
      await _refreshTimestamps();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${AppLang.local.sync_success}: '
            '${_counts[t.key] ?? 0} ${t.labelKey == 'sync_farmers' ? 'farmers' : (t.labelKey == 'sync_trainings' ? 'trainings' : 'farm lands')}',
          ),
          backgroundColor: ColorConstant.success,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${AppLang.local.sync_failed}: $e'),
          backgroundColor: ColorConstant.danger,
        ),
      );
    } finally {
      if (mounted) setState(() => _syncing[t.key] = false);
    }
  }

  Future<void> _syncAll() async {
    for (final t in _tables) {
      await _syncTable(t);
    }
  }

  String _str(dynamic v) => v == null ? '' : v.toString();

  String _formatTimestamp(int? ms) {
    if (ms == null) return AppLang.local.never_synced;
    try {
      final d = DateTime.fromMillisecondsSinceEpoch(ms);
      final hh = d.hour.toString().padLeft(2, '0');
      final mm = d.minute.toString().padLeft(2, '0');
      final day = d.day.toString().padLeft(2, '0');
      final month = d.month.toString().padLeft(2, '0');
      return '$day/$month/${d.year} $hh:$mm';
    } catch (_) {
      return AppLang.local.never_synced;
    }
  }

  String _label(String key) {
    switch (key) {
      case 'sync_farmers':
        return AppLang.local.sync_farmers;
      case 'sync_trainings':
        return AppLang.local.sync_trainings;
      case 'sync_farm_lands':
        return AppLang.local.sync_farm_lands;
      default:
        return key;
    }
  }

  IconData _iconFor(String key) {
    switch (key) {
      case 'farmers':
        return Icons.people_outline;
      case 'trainings':
        return Icons.school_outlined;
      case 'farm_lands':
        return Icons.landscape_outlined;
      default:
        return Icons.cloud_outlined;
    }
  }

  Color _colorFor(String key) {
    switch (key) {
      case 'farmers':
        return ColorConstant.primary;
      case 'trainings':
        return ColorConstant.gold;
      case 'farm_lands':
        return ColorConstant.secondary;
      default:
        return ColorConstant.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(
        title: AppLang.local.sync_screen,
        actions: [
          IconButton(
            icon: const Icon(Icons.cloud_download_outlined,
                color: Colors.white),
            tooltip: AppLang.local.sync_all,
            onPressed: _syncAll,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          _buildHintCard(),
          const SizedBox(height: 12),
          for (final t in _tables) ...[
            _buildSyncCard(t),
            const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }

  Widget _buildHintCard() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ColorConstant.info.withOpacity(0.10),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ColorConstant.info.withOpacity(0.30)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline,
              size: 18, color: ColorConstant.info),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              AppLang.local.sync_offline_hint,
              style: TextStyleConstant.robotoW400(
                fontSize: 12,
                color: ColorConstant.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSyncCard(_CacheTable t) {
    final count = _counts[t.key] ?? 0;
    final ts = _timestamps[t.key];
    final syncing = _syncing[t.key] ?? false;
    final color = _colorFor(t.key);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ColorConstant.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ColorConstant.grayEB),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(_iconFor(t.key), color: color, size: 22),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _label(t.labelKey),
                      style: TextStyleConstant.robotoW600(
                        fontSize: 14,
                        color: ColorConstant.heading,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Text(
                          '${AppLang.local.cached_count}: ',
                          style: TextStyleConstant.robotoW400(
                            fontSize: 11,
                            color: ColorConstant.textSecondary,
                          ),
                        ),
                        Text(
                          '$count',
                          style: TextStyleConstant.robotoW600(
                            fontSize: 11,
                            color: color,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              SizedBox(
                width: 32,
                height: 32,
                child: IconButton(
                  padding: EdgeInsets.zero,
                  iconSize: 18,
                  icon: syncing
                      ? SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: color,
                          ),
                        )
                      : const Icon(Icons.sync,
                          color: ColorConstant.primary),
                  tooltip: AppLang.local.sync_now,
                  onPressed: syncing ? null : () => _syncTable(t),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            decoration: BoxDecoration(
              color: ColorConstant.grayF6F7F9,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.history,
                    size: 12, color: ColorConstant.textSecondary),
                const SizedBox(width: 4),
                Text(
                  '${AppLang.local.last_synced}: ',
                  style: TextStyleConstant.robotoW400(
                    fontSize: 11,
                    color: ColorConstant.textSecondary,
                  ),
                ),
                Expanded(
                  child: Text(
                    _formatTimestamp(ts),
                    style: TextStyleConstant.robotoW500(
                      fontSize: 11,
                      color: ColorConstant.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              icon: const Icon(Icons.cloud_download_outlined, size: 16),
              label: Text(syncing
                  ? AppLang.local.syncing
                  : AppLang.local.sync_now),
              style: TextButton.styleFrom(foregroundColor: color),
              onPressed: syncing ? null : () => _syncTable(t),
            ),
          ),
        ],
      ),
    );
  }
}

/// Describes one cache table → endpoint mapping.
class _CacheTable {
  const _CacheTable({
    required this.key,
    required this.table,
    required this.labelKey,
    required this.endpoint,
    required this.listKey,
    required this.fallbackListKeys,
  });

  final String key;       // 'farmers' | 'trainings' | 'farm_lands'
  final String table;     // sqflite table name
  final String labelKey;   // i18n key for the section title
  final String endpoint;   // GET endpoint
  final String listKey;    // primary JSON list key
  final List<String> fallbackListKeys; // tried in order if listKey is missing
}
