import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';

/// NSSF Farmer Detail screen — read-only view of a single enrolled farmer,
/// with Edit + Delete action buttons in the app bar.
///
/// After Edit returns true (refresh signal), reloads the farmer.
/// After Delete, pops back to the My Farmers list (also refreshes it).
class NssfFarmerDetailScreen extends StatefulWidget {
  final String farmerId;
  const NssfFarmerDetailScreen({super.key, required this.farmerId});

  @override
  State<NssfFarmerDetailScreen> createState() => _NssfFarmerDetailScreenState();
}

class _NssfFarmerDetailScreenState extends State<NssfFarmerDetailScreen> {
  Map<String, dynamic>? _farmer;
  bool _loading = true;
  bool _deleting = false;

  @override
  void initState() {
    super.initState();
    _loadFarmer();
  }

  Future<void> _loadFarmer() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().get('/api/farmers/${widget.farmerId}');
      if (res.statusCode == 200) {
        final d = jsonDecode(res.body);
        setState(() {
          _farmer = (d['data'] ?? d['farmer'] ?? d) as Map<String, dynamic>?;
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
        _showError('Failed to load farmer (HTTP ${res.statusCode})');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        _showError('Network error: $e');
      }
    }
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Farmer?'),
        content: Text(
          'Are you sure you want to permanently delete '
          '${(_farmer?['firstName'] ?? '')} ${(_farmer?['lastName'] ?? '')}?\n\n'
          'This action cannot be undone.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: ColorConstant.danger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _deleting = true);
    try {
      final res = await ApiClient().delete('/api/farmers/${widget.farmerId}');
      if (res.statusCode == 200 || res.statusCode == 204) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Farmer deleted successfully'),
            backgroundColor: ColorConstant.success,
          ),
        );
        // Pop back to the My Farmers list (which will refresh)
        Navigator.of(context).pop(true);
      } else {
        String err = 'Failed to delete (HTTP ${res.statusCode})';
        try {
          final d = jsonDecode(res.body);
          err = d['error'] ?? err;
        } catch (_) {}
        _showError(err);
      }
    } catch (e) {
      _showError('Network error: $e');
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: ColorConstant.danger),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: AppBar(
        title: const Text('Farmer Details'),
        backgroundColor: ColorConstant.primary,
        foregroundColor: Colors.white,
        actions: [
          if (_farmer != null && !_loading)
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Edit',
              onPressed: () async {
                // Push edit screen, wait for result
                final result = await Navigator.of(context).pushNamed(
                  RouterName.nssfFarmerRegistration,
                  arguments: widget.farmerId,
                );
                // If edit returned true (updated), reload this detail screen
                if (result == true && mounted) {
                  _loadFarmer();
                }
              },
            ),
          if (_farmer != null && !_loading)
            IconButton(
              icon: _deleting
                  ? const SizedBox(
                      width: 18, height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.delete_outline),
              tooltip: 'Delete',
              onPressed: _deleting ? null : _confirmDelete,
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _farmer == null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: ColorConstant.danger),
                      const SizedBox(height: 12),
                      Text('Farmer not found', style: TextStyleConstant.quicksandW700(fontSize: 14)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadFarmer,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _buildHeader(),
                      const SizedBox(height: 16),
                      _buildInfoCard(),
                      const SizedBox(height: 16),
                      _buildValueChainsCard(),
                      const SizedBox(height: 16),
                      _buildLocationCard(),
                      const SizedBox(height: 16),
                      _buildMetaCard(),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
    );
  }

  Widget _buildHeader() {
    final firstName = (_farmer?['firstName'] ?? '') as String;
    final lastName = (_farmer?['lastName'] ?? '') as String;
    final name = '$firstName $lastName'.trim();
    final code = (_farmer?['farmerCode'] ?? '') as String;
    final status = (_farmer?['status'] ?? 'ACTIVE') as String;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            CircleAvatar(
              radius: 36,
              backgroundColor: ColorConstant.primary,
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 12),
            Text(name, style: TextStyleConstant.quicksandW700(fontSize: 18)),
            if (code.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text('Code: $code', style: TextStyleConstant.robotoW400(fontSize: 12, color: ColorConstant.text79)),
              ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: status == 'ACTIVE' ? ColorConstant.success.withOpacity(0.15) : ColorConstant.warning.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                status,
                style: TextStyleConstant.robotoW400(
                  fontSize: 11,
                  color: status == 'ACTIVE' ? ColorConstant.success : ColorConstant.warning,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    final phone = (_farmer?['phone'] ?? '—') as String;
    final nin = (_farmer?['nssfNationalId'] ?? _farmer?['nationalIdNo'] ?? '—') as String;
    final gender = (_farmer?['gender'] ?? '—') as String;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Contact & Identity', style: TextStyleConstant.quicksandW700(fontSize: 14)),
            const SizedBox(height: 12),
            _buildRow(Icons.phone_outlined, 'Phone', phone),
            const SizedBox(height: 10),
            _buildRow(Icons.badge_outlined, 'NIN', nin),
            const SizedBox(height: 10),
            _buildRow(Icons.person_outline, 'Gender', gender.isEmpty ? '—' : gender),
          ],
        ),
      ),
    );
  }

  Widget _buildValueChainsCard() {
    // BUG FIX: previously this only showed nssfValueChain (single) instead of
    // the full nssfValueChains array. Now we read the parsed array (which the
    // /api/farmers/[id] GET route returns as a proper List<String>).
    final dynamic rawChains = _farmer?['nssfValueChains'];
    List<String> chains = [];
    if (rawChains is List) {
      chains = rawChains.where((e) => e != null).map((e) => e.toString()).toList();
    } else if (_farmer?['nssfValueChain'] != null && (_farmer!['nssfValueChain'] as String).isNotEmpty) {
      chains = [_farmer!['nssfValueChain'] as String];
    }
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Value Chain(s)', style: TextStyleConstant.quicksandW700(fontSize: 14)),
            const SizedBox(height: 12),
            if (chains.isEmpty)
              Text('No value chains selected', style: TextStyleConstant.robotoW400(fontSize: 13, color: ColorConstant.text79))
            else
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: chains.map((vc) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF4F46E5).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF4F46E5).withOpacity(0.3)),
                    ),
                    child: Text(vc, style: TextStyleConstant.robotoW400(fontSize: 12, color: const Color(0xFF4F46E5))),
                  );
                }).toList(),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationCard() {
    // BUG FIX: previously this only showed 5 levels (village, sub-county,
    // district, region, country). Now shows ALL 7 levels — region, sub-region,
    // district, county, sub-county, parish, village.
    final region = (_farmer?['regionName'] ?? _farmer?['province'] ?? '—') as String;
    final subRegion = (_farmer?['subRegionName'] ?? '—') as String;
    final district = (_farmer?['districtName'] ?? _farmer?['district'] ?? '—') as String;
    final county = (_farmer?['countyName'] ?? _farmer?['commune'] ?? '—') as String;
    final subCounty = (_farmer?['subCountyName'] ?? '—') as String;
    final parish = (_farmer?['parishName'] ?? '—') as String;
    final village = (_farmer?['villageName'] ?? '—') as String;
    final country = (_farmer?['country'] ?? 'Uganda') as String;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Location', style: TextStyleConstant.quicksandW700(fontSize: 14)),
            const SizedBox(height: 12),
            _buildRow(Icons.public_outlined, 'Country', country),
            const SizedBox(height: 10),
            _buildRow(Icons.map_outlined, 'Region', region),
            const SizedBox(height: 10),
            _buildRow(Icons.location_searching_outlined, 'Sub-Region', subRegion),
            const SizedBox(height: 10),
            _buildRow(Icons.location_city_outlined, 'District', district),
            const SizedBox(height: 10),
            _buildRow(Icons.location_on_outlined, 'County', county),
            const SizedBox(height: 10),
            _buildRow(Icons.location_on_outlined, 'Sub-County', subCounty),
            const SizedBox(height: 10),
            _buildRow(Icons.location_on_outlined, 'Parish', parish),
            const SizedBox(height: 10),
            _buildRow(Icons.home_outlined, 'Village', village),
          ],
        ),
      ),
    );
  }

  Widget _buildMetaCard() {
    // BUG FIX: previously showed "—" for Enrolled By because the API didn't
    // return enrolledByOfficerName. Now it does (via the enrolledByOfficer
    // relation included in the GET /api/farmers/[id] route).
    final enrolledBy = (_farmer?['enrolledByOfficerName'] ?? '—') as String;
    final createdAt = (_farmer?['createdAt'] ?? '') as String;
    String enrolledAtStr = '—';
    if (createdAt.isNotEmpty) {
      try {
        final dt = DateTime.parse(createdAt);
        enrolledAtStr = '${dt.day}/${dt.month}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
      } catch (_) {}
    }
    // Removed NSSF Status row (per user request — only ONE status, which is
    // already shown in the header). Now the MetaCard shows just Enrolled By +
    // Enrolled At + Sync Status.
    final syncStatus = (_farmer?['sync_status'] ?? 'SYNCED').toString();
    final syncLabel = syncStatus == 'PENDING'
        ? 'Pending sync (offline)'
        : syncStatus == 'FAILED'
            ? 'Sync failed'
            : 'Synced to server';
    final syncIcon = syncStatus == 'PENDING'
        ? Icons.sync_problem_outlined
        : syncStatus == 'FAILED'
            ? Icons.error_outline
            : Icons.cloud_done_outlined;
    final syncColor = syncStatus == 'PENDING'
        ? ColorConstant.warning
        : syncStatus == 'FAILED'
            ? ColorConstant.danger
            : ColorConstant.success;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Enrollment Info', style: TextStyleConstant.quicksandW700(fontSize: 14)),
            const SizedBox(height: 12),
            _buildRow(Icons.person_pin_outlined, 'Enrolled By', enrolledBy),
            const SizedBox(height: 10),
            _buildRow(Icons.schedule_outlined, 'Enrolled At', enrolledAtStr),
            const SizedBox(height: 12),
            // Single sync status pill
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: syncColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(syncIcon, size: 16, color: syncColor),
                  const SizedBox(width: 6),
                  Text(
                    syncLabel,
                    style: TextStyleConstant.robotoW400(fontSize: 12, color: syncColor),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: ColorConstant.text79),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyleConstant.robotoW400(fontSize: 11, color: ColorConstant.text79)),
              const SizedBox(height: 2),
              Text(
                value.isEmpty ? '—' : value,
                style: TextStyleConstant.robotoW400(fontSize: 13, color: ColorConstant.heading),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
