// ignore_for_file: use_build_context_synchronously

import 'package:flutter/material.dart';

import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/hivebox_manager/box_farmer.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/hivebox_manager/box_sync_log.dart';
import 'package:agrobase_ekibbo/infrastructure/sync/sync_engine.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// Sync Data screen — the offline queue control center:
///   · Pending offline records (from Hive)
///   · Sync now (all) — also runs AUTOMATICALLY when connectivity returns
///   · Per-item retry for FAILED records (with the failure reason)
///   · Full audit log of every attempt (local + server SyncAuditLog)
/// ─────────────────────────────────────────────────────────────────────────
class ListFarmerLocalScreen extends StatefulWidget {
  const ListFarmerLocalScreen({super.key});

  @override
  State<ListFarmerLocalScreen> createState() => _ListFarmerLocalScreenState();
}

class _ListFarmerLocalScreenState extends State<ListFarmerLocalScreen> {
  List<Map<String, dynamic>> _pending = [];
  List<Map<String, dynamic>> _auditLog = [];
  bool _loading = true;
  bool _syncing = false;
  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    _load();
    SyncEngine.instance.onAutoSyncComplete = (synced, failed) {
      if (mounted) {
        _load();
        DialogHelper.showToast(context,
            'Auto-sync: $synced synced${failed > 0 ? ', $failed failed (see audit log)' : ''}');
      }
    };
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final pending = await BoxFarmer.getAll();
    final log = await BoxSyncLog.history();
    setState(() {
      _pending = pending.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      _auditLog = log;
      _loading = false;
    });
  }

  Future<void> _syncAll() async {
    if (_syncing) return;
    setState(() => _syncing = true);
    DialogHelper.showLoading();
    final (synced, failed) = await SyncEngine.instance.syncAllQueues();
    DialogHelper.hideLoading();
    await _load();
    setState(() => _syncing = false);
    DialogHelper.showOkDialog(
      context,
      failed > 0
          ? 'Synced: $synced, Failed: $failed.\nFailed records stay in the queue with their reason — open the Audit Log tab and tap a failed row to re-sync it.'
          : 'All records synced successfully ($synced).',
    );
  }

  Future<void> _retryOne(int localId) async {
    setState(() => _syncing = true);
    final (synced, failed) = await SyncEngine.instance.syncAllQueues(onlyLocalId: localId);
    await _load();
    setState(() => _syncing = false);
    DialogHelper.showOkDialog(
        context, failed > 0 ? 'Still failing — check the error detail in the audit log.' : 'Re-synced successfully.');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: 'Sync Data',
        color: ColorConstant.primary,
        titleColor: Colors.white,
        backColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: ColorConstant.primary))
          : Column(
              children: [
                // summary + actions
                Container(
                  padding: const EdgeInsets.all(16),
                  color: ColorConstant.grayF7F8FA,
                  child: Column(
                    children: [
                      Row(
                        children: [
                          _summaryTile('Pending', _pending.length, const Color(0xFFB45309)),
                          const SizedBox(width: 12),
                          _summaryTile(
                              'Failed (log)', _auditLog.where((l) => l['status'] == 'FAILED').length, const Color(0xFFDC2626)),
                          const SizedBox(width: 12),
                          _summaryTile('Synced (log)', _auditLog.where((l) => l['status'] == 'SUCCESS').length,
                              const Color(0xFF059669)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: ColorConstant.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          onPressed: _pending.isEmpty || _syncing ? null : _syncAll,
                          icon: _syncing
                              ? const SizedBox(
                                  width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Icon(Icons.sync),
                          label: Text(_pending.isEmpty ? 'Nothing to sync' : 'Sync All Now'),
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Records captured offline sync automatically when internet returns.',
                        style: TextStyle(fontSize: 11, color: ColorConstant.text79),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                // tabs
                Row(
                  children: [
                    _tab('Pending Queue (${_pending.length})', 0),
                    _tab('Audit Log (${_auditLog.length})', 1),
                  ],
                ),
                Expanded(
                  child: _tabIndex == 0 ? _pendingList() : _auditList(),
                ),
              ],
            ),
    );
  }

  Widget _summaryTile(String label, int value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withOpacity(0.4)),
        ),
        child: Column(children: [
          Text('$value', style: TextStyleConstant.worksansW600(fontSize: 20, color: color)),
          Text(label, style: const TextStyle(fontSize: 10, color: ColorConstant.text79)),
        ]),
      ),
    );
  }

  Widget _tab(String label, int index) {
    final active = _tabIndex == index;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _tabIndex = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: active ? ColorConstant.primary : Colors.transparent, width: 2)),
            color: active ? ColorConstant.primary.withOpacity(0.05) : Colors.transparent,
          ),
          child: Text(label,
              textAlign: TextAlign.center,
              style: TextStyleConstant.quicksandW600(
                  fontSize: 13, color: active ? ColorConstant.primary : ColorConstant.text79)),
        ),
      ),
    );
  }

  Widget _pendingList() {
    if (_pending.isEmpty) {
      return const Center(
        child: Text('No offline records — everything is synced.', style: TextStyle(color: ColorConstant.text79)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _pending.length,
      itemBuilder: (_, i) {
        final f = _pending[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: ListTile(
            leading: const CircleAvatar(child: Icon(Icons.person_outline)),
            title: Text(f['full_name'] ?? 'Unknown'),
            subtitle: Text('${f['phone_number'] ?? ''} · ${f['village'] ?? ''}',
                style: const TextStyle(fontSize: 12)),
            trailing: IconButton(
              icon: const Icon(Icons.cloud_upload, color: ColorConstant.primary),
              tooltip: 'Sync this record',
              onPressed: _syncing ? null : () => _retryOne(f['id'] as int),
            ),
          ),
        );
      },
    );
  }

  Widget _auditList() {
    if (_auditLog.isEmpty) {
      return const Center(
        child: Text('No sync attempts yet.', style: TextStyle(color: ColorConstant.text79)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _auditLog.length,
      itemBuilder: (_, i) {
        final l = _auditLog[i];
        final ok = l['status'] == 'SUCCESS';
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: ListTile(
            leading: Icon(
              ok ? Icons.check_circle : Icons.error_outline,
              color: ok ? const Color(0xFF059669) : const Color(0xFFDC2626),
            ),
            title: Text('${l['type']} #${l['local_id']} — ${l['status']}'),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${l['detail'] ?? ''}', style: const TextStyle(fontSize: 12)),
                Text('${l['at'] ?? ''}', style: const TextStyle(fontSize: 10, color: ColorConstant.text79)),
              ],
            ),
            isThreeLine: true,
            trailing: !ok
                ? TextButton(
                    onPressed: _syncing ? null : () => _retryOne(l['local_id'] as int),
                    child: const Text('Re-sync'),
                  )
                : null,
          ),
        );
      },
    );
  }
}
