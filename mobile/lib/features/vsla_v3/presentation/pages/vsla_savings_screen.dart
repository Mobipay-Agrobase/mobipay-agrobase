import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../core/config.dart';
import '../models/vsla_models.dart';

class VslaSavingsScreen extends StatefulWidget {
  const VslaSavingsScreen({super.key});

  @override
  State<VslaSavingsScreen> createState() => _VslaSavingsScreenState();
}

class _VslaSavingsScreenState extends State<VslaSavingsScreen> {
  List<VslaSaving> _savings = [];
  double _total = 0;
  int _totalShares = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService().get('/api/vsla/savings?limit=100') as Map<String, dynamic>;
      _savings = (res['savings'] as List).map((j) => VslaSaving.fromJson(j as Map<String, dynamic>)).toList();
      _total = (res['totalAmount'] as num?)?.toDouble() ?? 0;
      _totalShares = res['totalShares'] as int? ?? 0;
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
            color: const Color(0xFF059669),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total Savings', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        Text(formatUGX(_total), style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text('Shares', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Text('$_totalShares', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _savings.length,
              itemBuilder: (_, i) {
                final s = _savings[i];
                return Card(
                  margin: const EdgeInsets.only(bottom: 6),
                  child: ListTile(
                    title: Text(s.memberName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: Text('${formatDate(s.createdAt)} · ${s.paymentMethod}', style: const TextStyle(fontSize: 11)),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(formatUGX(s.amount), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.emerald, fontSize: 13)),
                        Text('${s.sharesBought} shares', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
