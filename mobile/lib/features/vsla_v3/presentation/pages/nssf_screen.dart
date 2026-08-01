import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../core/config.dart';

class NssfScreen extends StatefulWidget {
  const NssfScreen({super.key});

  @override
  State<NssfScreen> createState() => _NssfScreenState();
}

class _NssfScreenState extends State<NssfScreen> {
  List<dynamic> _contributions = [];
  double _total = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService().get('/api/nssf/contributions?limit=50') as Map<String, dynamic>;
      _contributions = res['contributions'] as List;
      _total = (res['total'] as num?)?.toDouble() ?? 0;
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    return RefreshIndicator(
      onRefresh: _load,
      child: Column(
        children: [
          Card(
            margin: const EdgeInsets.all(12),
            color: Colors.indigo,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Icon(Icons.landmark, color: Colors.white, size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('NSSF Processed', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        Text(formatUGX(_total), style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                        Text('${_contributions.length} contributions', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _contributions.length,
              itemBuilder: (_, i) {
                final c = _contributions[i] as Map<String, dynamic>;
                return Card(
                  margin: const EdgeInsets.only(bottom: 6),
                  child: ListTile(
                    title: Text(c['farmerName'] as String? ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(c['farmerPhone'] as String? ?? 'No phone', style: const TextStyle(fontSize: 11)),
                        Text('${formatDate(DateTime.tryParse(c['createdAt'] as String? ?? ''))} · ${c['paymentMethod']}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                      ],
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(formatUGX((c['amount'] as num?)?.toDouble()), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.indigo)),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(c['smsSent'] == true ? Icons.check_circle : Icons.access_time, size: 12, color: c['smsSent'] == true ? Colors.green : Colors.amber),
                            const SizedBox(width: 4),
                            _statusBadge(c['status'] as String? ?? ''),
                          ],
                        ),
                      ],
                    ),
                    isThreeLine: true,
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusBadge(String status) {
    final color = status == 'CONFIRMED' ? Colors.green : status == 'FAILED' ? Colors.red : Colors.amber;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
      child: Text(status, style: TextStyle(fontSize: 9, color: color, fontWeight: FontWeight.w600)),
    );
  }
}
