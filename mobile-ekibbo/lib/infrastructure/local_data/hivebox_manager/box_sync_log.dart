import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';

/// Local sync-audit box: every sync attempt (success or failure) is appended
/// so the Sync screen can show the history + failure reasons offline.
class BoxSyncLog {
  static const String boxName = 'sync_log';

  static Box? box;

  static Future _init() async {
    if (box != null) return;
    box = await Hive.openBox(boxName);
  }

  static Future log({
    required int localId,
    required String type,
    required String status, // SUCCESS | FAILED
    String? detail,
  }) async {
    try {
      await _init();
      await box!.add({
        'local_id': localId,
        'type': type,
        'status': status,
        'detail': detail ?? '',
        'at': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      debugPrint('BoxSyncLog log error: $e');
    }
  }

  /// Pending (not-yet-synced / failed) markers, newest first.
  static Future<List<Map<String, dynamic>>> getPending() async {
    try {
      await _init();
      final items = box!.values.toList().reversed
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      return items.where((e) => e['status'] == 'FAILED' || e['status'] == 'PENDING').toList();
    } catch (e) {
      debugPrint('BoxSyncLog getPending error: $e');
      return [];
    }
  }

  /// Full local audit history, newest first.
  static Future<List<Map<String, dynamic>>> history() async {
    try {
      await _init();
      final items = box!.values.toList().reversed
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      return items;
    } catch (_) {
      return [];
    }
  }
}
