import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';

/// "My Enrolled Farmers" screen for NSSF Extension Officers.
///
/// Calls GET /api/farmers — the API auto-scopes to the calling officer's
/// enrolledByOfficerId (set during farmer registration). So each officer
/// sees ONLY the farmers they personally enrolled. The NSSF Admin (TENANT_ADMIN)
/// sees ALL enrolled farmers across all officers (no scoping).
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
      // API auto-scopes to ctx.userId if role == EXTENSION_OFFICER
      final uri = Uri.parse(
        '${(await ApiClient().getBaseUrl())}/api/farmers?limit=200'
        '${_search.isNotEmpty ? '&search=${Uri.encodeComponent(_search)}' : ''}',
      );
      final res = await ApiClient().get(uri.toString().split(await ApiClient().getBaseUrl()).last);
      if (res.statusCode == 200) {
        final d = jsonDecode(res.body);
        setState(() {
          _farmers = List<Map<String, dynamic>>.from(d['farmers'] ?? []);
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
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
                              return Card(
                                margin: const EdgeInsets.symmetric(vertical: 4),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                child: ListTile(
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
                                  trailing: status == 'ACTIVE'
                                      ? const Icon(Icons.check_circle, color: Colors.green, size: 18)
                                      : Icon(Icons.pending, color: Colors.orange.shade400, size: 18),
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
}
