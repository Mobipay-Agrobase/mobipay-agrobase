import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../../core/sync/offline_repository.dart';
import '../../../../core/sync/sync_status_widget.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_shimmer.dart';

class CultivationsPage extends StatefulWidget {
  final String? farmId;
  const CultivationsPage({super.key, this.farmId});

  @override
  State<CultivationsPage> createState() => _CultivationsPageState();
}

class _CultivationsPageState extends State<CultivationsPage> {
  List<Map<String, dynamic>> _cultivations = [];
  Map<String, String> _farmNames = {};
  Map<String, String> _farmerLabels = {};
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final repo = context.read<OfflineRepository>();
    try {
      final farms = await repo.getFarmLands();
      final farmers = await repo.getFarmers(limit: 500);
      final farmNames = <String, String>{};
      final farmerLabels = <String, String>{};
      for (final fm in farms) {
        farmNames[fm['id']] = fm['name'] ?? '';
        final fid = fm['farmerId'];
        if (fid != null) {
          final farmer = farmers.where((x) => x['id'] == fid).firstOrNull;
          if (farmer != null) {
            final code = farmer['farmerCode'] ?? '';
            farmerLabels[fm['id']] = code.isNotEmpty ? '${farmer['firstName']} ${farmer['lastName']} ($code)' : '${farmer['firstName']} ${farmer['lastName']}';
          }
        }
      }
      final culs = await repo.getCultivations(farmId: widget.farmId);
      if (mounted) setState(() { _cultivations = culs; _farmNames = farmNames; _farmerLabels = farmerLabels; _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Cultivations'), backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.white, actions: const [SyncStatusWidget(), SizedBox(width: 12)]),
      body: _loading ? const LoadingShimmer() : _cultivations.isEmpty
          ? EmptyState(icon: Icons.grass, title: 'No Cultivations', description: 'Create a cultivation to track crop stages', actionLabel: 'Add Cultivation', onAction: _showCreate)
          : RefreshIndicator(onRefresh: _load, child: ListView.builder(padding: const EdgeInsets.all(16), itemCount: _cultivations.length, itemBuilder: (_, i) => _card(_cultivations[i]))),
      floatingActionButton: FloatingActionButton(onPressed: _showCreate, backgroundColor: AppTheme.primaryGreen, child: const Icon(Icons.add, color: Colors.white)),
    );
  }

  Widget _card(Map<String, dynamic> c) {
    final farmId = c['farmId'];
    return Card(child: ListTile(
      leading: const CircleAvatar(child: Icon(Icons.grass)),
      title: Text(c['cropName'] ?? ''),
      subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (farmId != null && _farmerLabels.containsKey(farmId)) Text(_farmerLabels[farmId]!, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        if (farmId != null && _farmNames.containsKey(farmId)) Text(_farmNames[farmId]!, style: const TextStyle(fontSize: 12)),
        if (c['cultivationAreaHa'] != null) Text('${c['cultivationAreaHa']} ha', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
      ]),
      trailing: Row(mainAxisSize: MainAxisSize.min, children: [
        IconButton(icon: const Icon(Icons.edit, size: 18), onPressed: () async { await context.push('/cultivation-edit/${c['id']}'); _load(); }),
        IconButton(icon: const Icon(Icons.visibility, size: 18), onPressed: () => context.push('/cultivation-detail/${c['id']}')),
      ]),
      onTap: () => context.push('/cultivation-detail/${c['id']}'),
    ));
  }

  void _showCreate() {
    context.push('/cultivation-create${widget.farmId != null ? '?farmId=${widget.farmId}' : ''}').then((_) => _load());
  }
}