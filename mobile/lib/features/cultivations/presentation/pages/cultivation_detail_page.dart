import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/sync/offline_repository.dart';
import '../../../../core/theme/app_theme.dart';
import 'cultivation_form_page.dart';

/// Cultivation detail view with Cultivation Info + Seed Info cards.
class CultivationDetailPage extends StatefulWidget {
  final String cultivationId;
  const CultivationDetailPage({super.key, required this.cultivationId});

  @override
  State<CultivationDetailPage> createState() => _CultivationDetailPageState();
}

class _CultivationDetailPageState extends State<CultivationDetailPage> {
  Map<String, dynamic>? _c;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final repo = context.read<OfflineRepository>();
    final c = await repo.getCultivationById(widget.cultivationId);
    Map<String, dynamic>? farmInfo;
    if (c != null && c['farmId'] != null) {
      final farms = await repo.getFarmLands();
      farmInfo = farms.where((f) => f['id'] == c['farmId']).firstOrNull;
    }
    if (mounted) setState(() { _c = c; c!['farmName'] = farmInfo?['name']; _loading = false; });
  }

  String _fmtDate(dynamic d) {
    if (d == null) return '—';
    final dt = DateTime.tryParse(d.toString());
    return dt == null ? '—' : '${dt.day}-${dt.month}-${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Cultivation Detail'),
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
        actions: [
          if (_c != null)
            IconButton(
              icon: const Icon(Icons.edit, color: Colors.white),
              onPressed: () async {
                final saved = await Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => CultivationFormPage(cultivationId: widget.cultivationId),
                ));
                if (saved == true) _load();
              },
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _c == null
              ? const Center(child: Text('Cultivation not found'))
              : ListView(padding: const EdgeInsets.all(16), children: [
                  _card('Cultivation Information', [
                    _row('Farm/Plot', _c!['farmName'] ?? '—'),
                    _row('Crop Category', _c!['cropCategory'] ?? '—'),
                    _row('Season', _c!['season'] ?? '—'),
                    _row('Crop', _c!['cropName'] ?? '—'),
                    _row('Variety', _c!['variety'] ?? '—'),
                    _row('Area', _c!['cultivationAreaHa'] != null ? '${_c!['cultivationAreaHa']} ha' : '—'),
                    _row('Sowing Date', _fmtDate(_c!['sowingDate'])),
                    _row('Est. Yield', _c!['estimatedYield'] != null ? '${_c!['estimatedYield']} kg' : '—'),
                    _row('Status', _c!['status'] ?? '—'),
                  ]),
                  const SizedBox(height: 16),
                  _card('Seed Information', [
                    _row('Seed Source', _c!['seedSource'] ?? '—'),
                    _row('Seed Treated', _c!['isSeedTreated'] == true ? 'Yes' : 'No'),
                    _row('Seed Type', _c!['seedType'] ?? '—'),
                    _row('Seed Quantity', _c!['seedQuantity'] != null ? '${_c!['seedQuantity']} kg' : '—'),
                    _row('Seed Price', _c!['seedPrice'] != null ? 'UGX ${_c!['seedPrice']}' : '—'),
                    _row('Seed Cost', _c!['seedCost'] != null ? 'UGX ${_c!['seedCost']}' : '—', highlight: true),
                    _row('Sowing Type', _c!['sowingType'] ?? '—'),
                    _row('Sowing Charges By', _c!['sowingChargesBy'] ?? '—'),
                    _row('Sowing Charges', _c!['sowingCharges'] != null ? 'UGX ${_c!['sowingCharges']}' : '—'),
                    _row('Sowing Cost', _c!['sowingCost'] != null ? 'UGX ${_c!['sowingCost']}' : '—', highlight: true),
                    _row('Seedling Count', _c!['seedlingCount'] != null ? '${_c!['seedlingCount']}' : '—'),
                    _row('Bamboo Variety', _c!['bambooVariety'] ?? '—'),
                  ]),
                ]),
    );
  }

  Widget _card(String title, List<Widget> rows) {
    return Card(
      child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.primaryGreen)),
        const SizedBox(height: 12),
        ...rows,
      ])),
    );
  }

  Widget _row(String label, String value, {bool highlight = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        SizedBox(width: 140, child: Text(label, style: TextStyle(fontSize: 13, color: Colors.grey[600]))),
        Expanded(child: Text(value, style: TextStyle(fontSize: 13, fontWeight: highlight ? FontWeight.w700 : FontWeight.w400, color: highlight ? AppTheme.primaryGreen : null))),
      ]),
    );
  }
}