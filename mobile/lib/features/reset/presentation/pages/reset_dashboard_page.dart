import 'package:flutter/material.dart';
import 'package:agrobase_mobile/features/reset/data/services/reset_api.dart';

class ResetDashboardPage extends StatefulWidget {
  const ResetDashboardPage({super.key});
  @override
  State<ResetDashboardPage> createState() => _ResetDashboardPageState();
}

class _ResetDashboardPageState extends State<ResetDashboardPage> {
  Map<String, dynamic>? _data;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ResetApi.getDashboard();
      setState(() { _data = data; _loading = false; });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ReSET Dashboard'), backgroundColor: const Color(0xFF059669), foregroundColor: Colors.white),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // KPI Grid
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: 1.3,
                    children: [
                      _kpiCard('Beneficiaries', '${_data?['counts']?['beneficiaries'] ?? 0}', Icons.people, Colors.green),
                      _kpiCard('Vouchers', '${_data?['counts']?['vouchers'] ?? 0}', Icons.receipt, Colors.amber),
                      _kpiCard('Merchants', '${_data?['counts']?['merchants'] ?? 0}', Icons.store, Colors.blue),
                      _kpiCard('Redemptions', '${_data?['counts']?['redemptions'] ?? 0}', Icons.check_circle, Colors.purple),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // By Settlement
                  const Text('By Settlement', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: (_data?['breakdowns']?['bySettlement'] as List?)?.map((s) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(s['name'] ?? '', style: const TextStyle(fontSize: 13)),
                              Text('${s['_count'] ?? s['count'] ?? 0}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        )).toList() ?? [const Text('No data')],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // By Partner
                  const Text('By Partner', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: (_data?['breakdowns']?['byPartner'] as List?)?.map((p) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(p['enrolledBy'] == 'SWISS_CONTACT' ? 'Swiss Contact' : p['enrolledBy'] ?? '', style: const TextStyle(fontSize: 13)),
                              Text('${p['_count'] ?? p['count'] ?? 0}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        )).toList() ?? [const Text('No data')],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _kpiCard(String label, String value, IconData icon, MaterialColor color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
