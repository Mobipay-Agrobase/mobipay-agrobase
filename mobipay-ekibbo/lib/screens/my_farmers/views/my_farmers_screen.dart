import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/data/nssf_sync_engine.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';

/// "My Enrolled Farmers" screen for NSSF Extension Officers.
///
/// Displays a MERGED list of:
///   1. Farmers already synced to the server (GET /api/farmers — auto-scoped
///      to the calling officer's enrolledByOfficerId)
///   2. Farmers saved locally but not yet synced (from SQLite nssf_farmers table)
///
/// Local-only (pending) farmers appear with an amber "Pending sync" badge so
/// the officer can distinguish them from synced ones.
///
/// Tapping a farmer opens the NSSF Farmer Detail screen, which shows the
/// full record + sync status + Edit + Delete actions.
class MyFarmersScreen extends StatefulWidget {
  const MyFarmersScreen({super.key});

  @override
  State<MyFarmersScreen> createState() => _MyFarmersScreenState();
}

class _MyFarmersScreenState extends State<MyFarmersScreen> {
  List<Map<String, dynamic>> _farmers = [];
  bool _loading = true;
  String _search = '';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadFarmers();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadFarmers() async {
    setState(() => _loading = true);
    try {
      // 1. Always load local farmers from SQLite (works offline)
      final localFarmers = await NssfSyncEngine().listAllFarmers();
      // Convert local rows to the same shape as server farmers
      final localMapped = localFarmers.map((r) => <String, dynamic>{
        'id': r['server_id'] ?? r['local_id'],  // prefer server_id if synced
        'local_id': r['local_id'],
        'firstName': r['first_name'] ?? '',
        'lastName': r['last_name'] ?? '',
        'phone': r['phone'] ?? '',
        'nssfNationalId': r['nin'],
        'nssfValueChains': r['value_chains'] ?? <String>[],
        'district': r['district'],
        'villageName': r['village_name'],
        'status': 'ACTIVE',
        'sync_status': r['sync_status'] ?? 'PENDING',
        '_source': 'local',
      }).toList();

      // 2. Try to fetch server farmers (auto-scoped to calling officer)
      List<Map<String, dynamic>> serverFarmers = [];
      try {
        final path = '/api/farmers?limit=200'
            '${_search.isNotEmpty ? '&search=${Uri.encodeComponent(_search)}' : ''}';
        final res = await ApiClient().get(path);
        if (res.statusCode == 200) {
          final d = jsonDecode(res.body);
          serverFarmers = List<Map<String, dynamic>>.from(d['farmers'] ?? []);
          // Tag each server farmer with _source: 'server' + sync_status: 'SYNCED'
          for (final f in serverFarmers) {
            f['_source'] = 'server';
            f['sync_status'] = 'SYNCED';
          }
        }
      } catch (_) {
        // Offline — only show local farmers (including pending sync)
      }

      // 3. Merge: server farmers first, then local-only pending farmers
      //    (deduplicate by phone — if a farmer exists on both, keep the server version)
      final seenPhones = <String>{};
      final merged = <Map<String, dynamic>>[];
      for (final f in serverFarmers) {
        final phone = (f['phone'] ?? '').toString();
        if (phone.isNotEmpty) seenPhones.add(phone);
        merged.add(f);
      }
      for (final f in localMapped) {
        final phone = (f['phone'] ?? '').toString();
        final status = (f['sync_status'] ?? '').toString();
        // Only add local farmers that are NOT already on the server
        // (i.e. pending sync, or phone not in server list)
        if (status == 'PENDING' && !seenPhones.contains(phone)) {
          merged.add(f);
        }
      }

      setState(() {
        _farmers = merged;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: AppBar(
        title: const Text('My Enrolled Farmers'),
        backgroundColor: ColorConstant.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadFarmers,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Search bar
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: TextField(
                controller: _searchCtrl,
                decoration: InputDecoration(
                  hintText: 'Search by name, phone, or code...',
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  isDense: true,
                ),
                onSubmitted: (_) {
                  setState(() => _search = _searchCtrl.text.trim());
                  _loadFarmers();
                },
              ),
            ),
            // Farmer count
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  '${_farmers.length} farmer(s) enrolled by you',
                  style: TextStyleConstant.robotoW400(fontSize: 12, color: ColorConstant.text79),
                ),
              ),
            ),
            // List
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _farmers.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.people_outline, size: 64, color: Colors.grey),
                              const SizedBox(height: 12),
                              Text(
                                'No farmers enrolled yet',
                                style: TextStyleConstant.quicksandW700(fontSize: 14),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Tap "Enroll Farmer" to register your first farmer',
                                style: TextStyleConstant.robotoW400(fontSize: 12, color: ColorConstant.text79),
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadFarmers,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            itemCount: _farmers.length,
                            itemBuilder: (ctx, i) {
                              final f = _farmers[i];
                              final name = '${f['firstName'] ?? ''} ${f['lastName'] ?? ''}'.trim();
                              final phone = f['phone'] ?? '';
                              final nin = f['nssfNationalId'] ?? f['nationalIdNo'] ?? '';
                              final valueChains = f['nssfValueChains'] ?? (f['nssfValueChain'] != null ? [f['nssfValueChain']] : []);
                              final district = f['district'] ?? '';
                              final villageName = f['villageName'] ?? '';
                              final status = f['status'] ?? '';
                              final syncStatus = (f['sync_status'] ?? 'SYNCED').toString();
                              final isPending = syncStatus == 'PENDING';
                              final isLocalOnly = (f['_source'] ?? 'server') == 'local';
                              return Card(
                                margin: const EdgeInsets.symmetric(vertical: 4),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                child: ListTile(
                                  onTap: () async {
                                    // Open the NSSF Farmer Detail screen.
                                    // After it pops (with refresh=true), reload the list.
                                    final result = await Navigator.of(context).pushNamed(
                                      RouterName.nssfFarmerDetail,
                                      arguments: f['id'],
                                    );
                                    if (result == true && mounted) {
                                      _loadFarmers();
                                    }
                                  },
                                  leading: CircleAvatar(
                                    backgroundColor: ColorConstant.primary,
                                    child: Text(
                                      name.isNotEmpty ? name[0].toUpperCase() : '?',
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  title: Text(name, style: TextStyleConstant.quicksandW700(fontSize: 14)),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const SizedBox(height: 4),
                                      if (phone.isNotEmpty)
                                        Text('Phone: $phone', style: TextStyleConstant.robotoW400(fontSize: 12, color: ColorConstant.text79)),
                                      if (nin.isNotEmpty)
                                        Text('NIN: $nin', style: TextStyleConstant.robotoW400(fontSize: 12, color: ColorConstant.text79)),
                                      if (valueChains is List && (valueChains as List).isNotEmpty)
                                        Text('Value: ${(valueChains as List).join(', ')}', style: TextStyleConstant.robotoW400(fontSize: 12, color: ColorConstant.text79)),
                                      if (district != null && district.toString().isNotEmpty)
                                        Text('Location: $district${villageName != null && villageName.toString().isNotEmpty ? ' / $villageName' : ''}', style: TextStyleConstant.robotoW400(fontSize: 12, color: ColorConstant.text79)),
                                    ],
                                  ),
                                  trailing: _buildTrailing(status, syncStatus, isLocalOnly),
                                ),
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  /// Builds the trailing badge for each farmer row.
  ///   - SYNCED (server): green check icon
  ///   - SYNCED (local):  green check + "Synced" text
  ///   - PENDING:         amber clock + "Pending sync" pill
  ///   - FAILED:          red error + "Sync failed" pill
  Widget _buildTrailing(String status, String syncStatus, bool isLocalOnly) {
    if (syncStatus == 'PENDING') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: ColorConstant.warning.withOpacity(0.15),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.sync_problem, size: 14, color: ColorConstant.warning),
            const SizedBox(width: 4),
            Text(
              'Pending sync',
              style: TextStyleConstant.robotoW400(fontSize: 10, color: ColorConstant.warning),
            ),
          ],
        ),
      );
    }
    if (syncStatus == 'FAILED') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: ColorConstant.danger.withOpacity(0.15),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 14, color: ColorConstant.danger),
            const SizedBox(width: 4),
            Text(
              'Sync failed',
              style: TextStyleConstant.robotoW400(fontSize: 10, color: ColorConstant.danger),
            ),
          ],
        ),
      );
    }
    return const Icon(Icons.check_circle, color: Colors.green, size: 18);
  }
}
