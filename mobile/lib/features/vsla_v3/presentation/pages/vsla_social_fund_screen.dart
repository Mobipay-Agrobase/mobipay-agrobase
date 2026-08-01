import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../core/config.dart';
import '../models/vsla_models.dart';

class VslaSocialFundScreen extends StatefulWidget {
  const VslaSocialFundScreen({super.key});

  @override
  State<VslaSocialFundScreen> createState() => _VslaSocialFundScreenState();
}

class _VslaSocialFundScreenState extends State<VslaSocialFundScreen> {
  List<SocialFundContribution> _contributions = [];
  List<SocialFundClaim> _claims = [];
  double _contribTotal = 0;
  bool _loading = true;
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final contrib = await ApiService().get('/api/vsla/social-fund/contributions') as Map<String, dynamic>;
      _contributions = (contrib['contributions'] as List).map((j) => SocialFundContribution.fromJson(j as Map<String, dynamic>)).toList();
      _contribTotal = (contrib['total'] as num?)?.toDouble() ?? 0;
      final claims = await ApiService().get('/api/vsla/social-fund/claims') as Map<String, dynamic>;
      _claims = (claims['claims'] as List).map((j) => SocialFundClaim.fromJson(j as Map<String, dynamic>)).toList();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    return Column(
      children: [
        Card(
          margin: const EdgeInsets.all(12),
          color: Colors.purple,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Icon(Icons.volunteer_activism, color: Colors.white, size: 32),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Social Fund', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Text(formatUGX(_contribTotal), style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        TabBar(
          onTap: (i) => setState(() => _tab = i),
          labelColor: const Color(0xFF059669),
          tabs: const [Tab(text: 'Contributions'), Tab(text: 'Claims')],
        ),
        Expanded(
          child: _tab == 0
              ? ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: _contributions.length,
                  itemBuilder: (_, i) {
                    final c = _contributions[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 6),
                      child: ListTile(
                        title: Text(c.memberName ?? 'Group', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        subtitle: Text('${formatDate(c.createdAt)} · ${c.contributionType}', style: const TextStyle(fontSize: 11)),
                        trailing: Text(formatUGX(c.amount), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.purple)),
                      ),
                    );
                  },
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: _claims.length,
                  itemBuilder: (_, i) {
                    final c = _claims[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(child: Text(c.memberName, style: const TextStyle(fontWeight: FontWeight.w600))),
                                _badge(c.status),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(color: Colors.purple.shade100, borderRadius: BorderRadius.circular(6)),
                              child: Text(c.claimType, style: TextStyle(fontSize: 10, color: Colors.purple.shade800, fontWeight: FontWeight.w600)),
                            ),
                            const SizedBox(height: 6),
                            Text(c.description, style: const TextStyle(fontSize: 12, color: Colors.grey.shade700)),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Spacer(),
                                Text(formatUGX(c.amount), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.amber.shade800)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _badge(String status) {
    final color = status == 'DISBURSED' ? Colors.green : status == 'PENDING' ? Colors.amber : status == 'REJECTED' ? Colors.red : Colors.blue;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
      child: Text(status, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
    );
  }
}
