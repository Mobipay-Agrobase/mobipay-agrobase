import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../../core/sync/offline_repository.dart';
import '../../../../core/sync/sync_status_widget.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_shimmer.dart';

/// Farm Lands screen — list + create/edit/delete + detail with offline GPS polygon.
class FarmLandsPage extends StatefulWidget {
  const FarmLandsPage({super.key});

  @override
  State<FarmLandsPage> createState() => _FarmLandsPageState();
}

class _FarmLandsPageState extends State<FarmLandsPage> {
  List<Map<String, dynamic>> _farms = [];
  Map<String, String> _farmerNames = {};
  bool _loading = true;
  String? _farmerId;

  @override
  void initState() {
    super.initState();
    _loadFarms();
  }

  Future<void> _loadFarms() async {
    final repo = context.read<OfflineRepository>();
    try {
      final farmers = await repo.getFarmers(limit: 500);
      if (farmers.isNotEmpty) {
        _farmerId = farmers[0]['id'];
        final farms = await repo.getFarmLands(farmerId: _farmerId);
        final names = <String, String>{};
        for (final fm in farmers) {
          final code = fm['farmerCode'] ?? '';
          names[fm['id']] = code.isNotEmpty ? '${fm['firstName']} ${fm['lastName']} ($code)' : '${fm['firstName']} ${fm['lastName']}';
        }
        setState(() { _farms = farms; _farmerNames = names; _loading = false; });
      } else {
        setState(() { _loading = false; });
      }
    } catch (_) { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Farm Lands'),
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
        actions: const [SyncStatusWidget(), SizedBox(width: 12)],
      ),
      body: _loading
          ? const LoadingShimmer()
          : _farms.isEmpty
              ? EmptyState(
                  icon: Icons.landscape_outlined,
                  title: 'No Farm Lands Yet',
                  description: 'Create your first farm land with GPS boundary',
                  actionLabel: 'Create Farm Land',
                  onAction: _showCreateDialog,
                )
              : RefreshIndicator(
                  onRefresh: _loadFarms,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _farms.length,
                    itemBuilder: (context, index) => _buildFarmCard(_farms[index]),
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateDialog,
        backgroundColor: AppTheme.primaryGreen,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildFarmCard(Map<String, dynamic> farm) {
    final name = farm['name'] ?? 'Unnamed';
    final size = farm['sizeHectares'];
    final ownership = farm['landOwnership'] ?? 'Unknown';
    final water = farm['waterSource'] ?? 'N/A';
    final syncStatus = farm['syncStatus'] ?? 'synced';
    final hasPolygon = farm['boundaryGeoJson'] != null;
    final farmerLabel = _farmerNames[farm['farmerId']] ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () async {
          final changed = await context.push('/farm-lands/${farm['id']}');
          if (changed == true) _loadFarms();
        },
        child: ExpansionTile(
          leading: CircleAvatar(backgroundColor: AppTheme.lightGreen, child: Icon(Icons.landscape, color: AppTheme.primaryGreen, size: 20)),
          title: Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (farmerLabel.isNotEmpty) Text(farmerLabel, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
            Row(children: [
              if (size != null) Padding(padding: const EdgeInsets.only(right: 8), child: Text('${size.toStringAsFixed(2)} ha', style: const TextStyle(fontSize: 12))),
              if (syncStatus == 'pending')
                Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: Colors.amber.shade100, borderRadius: BorderRadius.circular(8)), child: const Text('Pending', style: TextStyle(fontSize: 10, color: Colors.amber)))
              else
                Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: Colors.green.shade100, borderRadius: BorderRadius.circular(8)), child: const Text('Synced', style: TextStyle(fontSize: 10, color: Colors.green))),
            ]),
          ]),
          children: [
            Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _row('Ownership', ownership), _row('Water Source', water), _row('GPS Polygon', hasPolygon ? 'Captured' : 'Not captured'),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: OutlinedButton.icon(icon: const Icon(Icons.add, size: 16), label: const Text('Add Cultivation'), onPressed: () async {
                  await context.push('/cultivation-create?farmId=${farm['id']}');
                  _loadFarms();
                })),
              ]),
              const SizedBox(height: 8),
              Row(children: [
                Expanded(child: OutlinedButton.icon(icon: const Icon(Icons.edit, size: 16), label: const Text('Edit'), onPressed: () async {
                  await context.push('/farm-lands/${farm['id']}/edit');
                  _loadFarms();
                })),
                const SizedBox(width: 8),
                Expanded(child: TextButton.icon(icon: const Icon(Icons.delete, color: AppTheme.errorRed), label: const Text('Delete', style: TextStyle(color: AppTheme.errorRed)), onPressed: () => _confirmDelete(farm))),
              ]),
            ])),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmDelete(Map<String, dynamic> farm) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Farm Land'),
        content: Text('Delete "${farm['name']}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: AppTheme.errorRed),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      final repo = context.read<OfflineRepository>();
      await repo.deleteFarmLand(farm['id']);
      _loadFarms();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Farm "${farm['name']}" deleted')));
    }
  }

  Widget _row(String l, String v) => Padding(padding: const EdgeInsets.only(bottom: 4), child: Row(children: [SizedBox(width: 100, child: Text(l, style: TextStyle(fontSize: 12, color: Colors.grey[600]))), Expanded(child: Text(v, style: const TextStyle(fontSize: 13)))]));

  void _showCreateDialog() {
    context.push('/farm-lands/new?farmerId=${_farmerId ?? ''}').then((_) => _loadFarms());
  }
}
