import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../core/config.dart';
import '../models/vsla_models.dart';
import 'vsla_group_detail_screen.dart';

class VslaGroupsScreen extends StatefulWidget {
  const VslaGroupsScreen({super.key});

  @override
  State<VslaGroupsScreen> createState() => _VslaGroupsScreenState();
}

class _VslaGroupsScreenState extends State<VslaGroupsScreen> {
  List<VslaGroup> _groups = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ApiService().get('/api/vsla/groups') as Map<String, dynamic>;
      final list = (res['groups'] as List).map((j) => VslaGroup.fromJson(j as Map<String, dynamic>)).toList();
      setState(() {
        _groups = list;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _load, child: const Text('Retry')),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _groups.length,
        itemBuilder: (_, i) {
          final g = _groups[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () {
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => VslaGroupDetailScreen(group: g)));
              },
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(g.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        ),
                        _statusBadge(g.status),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text('${g.code} · ${g.district ?? '—'}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _miniStat('Members', '${g.memberCount}'),
                        _miniStat('Savings', formatUGX(g.totalSavings)),
                        _miniStat('Outstanding', formatUGX(g.outstandingLoans)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _miniStat('Share', formatUGX(g.shareValue)),
                        _miniStat('Rate', '${g.loanInterestRate.toStringAsFixed(0)}%'),
                        _miniStat('Welfare', formatUGX(g.socialFundBalance)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _miniStat(String label, String value) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }

  Widget _statusBadge(String status) {
    final color = status == 'ACTIVE' ? Colors.emerald : status == 'CLOSED' ? Colors.red : Colors.amber;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(status, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
    );
  }
}
