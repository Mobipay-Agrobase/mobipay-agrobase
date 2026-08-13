import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../../core/sync/offline_repository.dart';
import '../../../../core/theme/app_theme.dart';
import 'farm_land_form_page.dart';
import '../../../cultivations/presentation/pages/cultivation_form_page.dart';

/// Farm Land detail view with tabs: Overview, Soil, Labour, Conversion, Cultivations.
class FarmLandDetailPage extends StatefulWidget {
  final String farmLandId;
  const FarmLandDetailPage({super.key, required this.farmLandId});

  @override
  State<FarmLandDetailPage> createState() => _FarmLandDetailPageState();
}

class _FarmLandDetailPageState extends State<FarmLandDetailPage> {
  Map<String, dynamic>? _f;
  List<Map<String, dynamic>> _cultivations = [];
  String _farmerName = '';
  bool _loading = true;
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final repo = context.read<OfflineRepository>();
    final f = await repo.getFarmLandById(widget.farmLandId);
    final farmers = await repo.getFarmers();
    final farmer = farmers.where((x) => x['id'] == f?['farmerId']).firstOrNull;
    final culs = await repo.getCultivations(farmId: widget.farmLandId);
    if (mounted) setState(() {
      _f = f;
      _cultivations = culs;
      if (farmer != null) {
        _farmerName = '${farmer['firstName']} ${farmer['lastName']}';
        if (farmer['farmerCode'] != null) _farmerName += ' (${farmer['farmerCode']})';
      }
      _loading = false;
    });
  }

  String _fmtNum(dynamic v) => v == null ? '—' : '${v}';
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
        title: const Text('Farm Land Detail'),
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
        actions: [
          if (_f != null)
            IconButton(
              icon: const Icon(Icons.edit, color: Colors.white),
              onPressed: () async {
                final saved = await Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => FarmLandFormPage(farmLandId: widget.farmLandId),
                ));
                if (saved == true) _load();
              },
            ),
          if (_f != null)
            IconButton(
              icon: const Icon(Icons.add, color: Colors.white),
              onPressed: () async {
                final saved = await Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => _CultAddPage(farmId: widget.farmLandId),
                ));
                if (saved == true) _load();
              },
              tooltip: 'Add Cultivation',
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _f == null
              ? const Center(child: Text('Farm Land not found'))
              : Column(children: [
                  _tabBar(),
                  Expanded(child: IndexedStack(index: _tab, children: [
                    _overviewTab(),
                    _soilTab(),
                    _labourTab(),
                    _conversionTab(),
                    _cultivationsTab(),
                  ])),
                ]),
    );
  }

  Widget _tabBar() {
    const tabs = ['Overview', 'Soil', 'Labour', 'Conversion', 'Cultivations'];
    return SizedBox(
      height: 48,
      child: ListView.separated(
        padding: const EdgeInsets.all(8),
        scrollDirection: Axis.horizontal,
        itemCount: tabs.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final selected = _tab == i;
          return ChoiceChip(
            label: Text(i == 4 ? '${tabs[i]} (${_cultivations.length})' : tabs[i]),
            selected: selected,
            onSelected: (_) => setState(() => _tab = i),
            selectedColor: AppTheme.primaryGreen,
            labelStyle: TextStyle(color: selected ? Colors.white : AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
          );
        },
      ),
    );
  }

  Widget _overviewTab() {
    return ListView(padding: const EdgeInsets.all(16), children: [
      _card('Farm Information', [
        _row('Farm Name', _f!['name'] ?? '—'),
        _row('Farmer', _farmerName.isEmpty ? '—' : _farmerName),
        _row('Area', _f!['sizeHectares'] != null ? '${_f!['sizeHectares']} ha' : '—'),
        _row('Ownership', _f!['landOwnership'] ?? '—'),
        _row('GPS', _coords()),
        _row('Survey No', _f!['landSurveyNo'] ?? '—'),
      ]),
      const SizedBox(height: 16),
      _card('Location Details', [
        _row('Topology', _f!['landTopology'] ?? '—'),
        _row('Gradient', _f!['landGradient'] ?? '—'),
        _row('Water Source', _f!['waterSource'] ?? '—'),
        _row('Power Source', _f!['powerSource'] ?? '—'),
        _row('Soil Fertility', _f!['soilFertility'] ?? '—'),
      ]),
    ]);
  }

  String _coords() {
    if (_f!['latitude'] == null && _f!['longitude'] == null) return '—';
    return '${_f!['latitude']}, ${_f!['longitude']}';
  }

  Widget _soilTab() {
    return ListView(padding: const EdgeInsets.all(16), children: [
      _card('Irrigation Information', [
        _row('Irrigation Source', _f!['irrigationSource'] ?? '—'),
        _row('Irrigation Type', _f!['irrigationType'] ?? '—'),
        _row('Soil Fertility', _f!['soilFertility'] ?? '—'),
      ]),
    ]);
  }

  Widget _labourTab() {
    return ListView(padding: const EdgeInsets.all(16), children: [
      _card('Farm Labour', [
        _row('Full-time Workers', _fmtNum(_f!['fullTimeWorkers'])),
        _row('Part-time Workers', _fmtNum(_f!['partTimeWorkers'])),
        _row('Seasonal Workers', _fmtNum(_f!['seasonalWorkers'])),
        _row('Family Workers', _fmtNum(_f!['familyWorkers'])),
      ]),
    ]);
  }

  Widget _conversionTab() {
    return ListView(padding: const EdgeInsets.all(16), children: [
      _card('Conversion', [
        _row('Last Chemical App', _fmtDate(_f!['lastChemicalApplicationDate'])),
        _row('Conventional Lands', _fmtNum(_f!['conventionalLands'])),
        _row('Fallow/Pasture Land', _fmtNum(_f!['fallowPastureLand'])),
        _row('Certification Type', _f!['certType'] ?? '—'),
        _row('Conversion Status', _f!['conversionStatus'] ?? '—'),
        _row('Inspector', _f!['inspectorName'] ?? '—'),
        _row('Qualified', _f!['conversionQualified'] == null ? '—' : (_f!['conversionQualified'] == true ? 'Yes' : 'No')),
      ]),
    ]);
  }

  Widget _cultivationsTab() {
    if (_cultivations.isEmpty) {
      return const Center(child: Text('No cultivations for this farm land', style: TextStyle(color: AppTheme.textSecondary)));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _cultivations.length,
      itemBuilder: (context, i) {
        final c = _cultivations[i];
        return Card(child: ListTile(
          leading: const CircleAvatar(child: Icon(Icons.grass)),
          title: Text(c['cropName'] ?? ''),
          subtitle: Text('${c['variety'] ?? ''} · ${c['season'] ?? ''}'),
          trailing: c['cultivationAreaHa'] != null ? Text('${c['cultivationAreaHa']} ha') : null,
          onTap: () => context.push('/cultivation-detail/${c['id']}'),
        ));
      },
    );
  }

  Widget _card(String title, List<Widget> rows) {
    return Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.primaryGreen)),
      const SizedBox(height: 12),
      ...rows,
    ])));
  }

  Widget _row(String label, String value) {
    return Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SizedBox(width: 160, child: Text(label, style: TextStyle(fontSize: 13, color: Colors.grey[600]))),
      Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
    ]));
  }
}

// Light wrapper to add a cultivation against this farm land.
class _CultAddPage extends StatefulWidget {
  final String farmId;
  const _CultAddPage({required this.farmId});
  @override
  State<_CultAddPage> createState() => _CultAddPageState();
}

class _CultAddPageState extends State<_CultAddPage> {
  @override
  Widget build(BuildContext context) {
    return CultivationFormPage(farmId: widget.farmId);
  }
}