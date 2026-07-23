import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../core/config.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ApiService().get('/api/admin/overview') as Map<String, dynamic>;
      setState(() {
        _data = data;
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
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off, size: 48, color: Colors.grey),
              const SizedBox(height: 12),
              Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: _load, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    final counts = _data!['counts'] as Map<String, dynamic>;
    final fin = _data!['financials'] as Map<String, dynamic>;
    final portfolio = _data!['loanPortfolio'] as Map<String, dynamic>;

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Greeting card
          Card(
            color: const Color(0xFF059669),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Hello, ${ApiService().user?['name'] ?? 'User'}',
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${ApiService().user?['role'] ?? ''} · ${ApiService().user?['tenantName'] ?? 'MobiPay Agrobase'}',
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // KPI grid
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.1,
            children: [
              _kpi('VSLA Groups', '${counts['vslaGroups']}', Icons.groups, Colors.emerald),
              _kpi('Total Savings', formatUGX((fin['totalSavings'] as num).toDouble()), Icons.savings, Colors.blue),
              _kpi('Outstanding Loans', formatUGX((fin['outstandingLoans'] as num).toDouble()), Icons.account_balance_wallet, Colors.amber),
              _kpi('Disbursed', formatUGX((fin['disbursedLoans'] as num).toDouble()), Icons.trending_up, Colors.purple),
              _kpi('NSSF Processed', formatUGX((fin['nssfTotal'] as num).toDouble()), Icons.landmark, Colors.indigo),
              _kpi('Payments', formatUGX((fin['paymentsTotal'] as num).toDouble()), Icons.phone_android, Colors.teal),
            ],
          ),
          const SizedBox(height: 20),
          // Loan portfolio
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.pie_chart, size: 18, color: Color(0xFF059669)),
                      const SizedBox(width: 8),
                      const Text('Loan Portfolio', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      const Spacer(),
                      Text('${counts['vslaLoans']} total', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _portfolioRow('Active', portfolio['active'] as int, Colors.blue),
                  _portfolioRow('Pending', portfolio['pending'] as int, Colors.amber),
                  _portfolioRow('Overdue', portfolio['overdue'] as int, Colors.red),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Module shortcuts
          const Text('Quick Actions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 8),
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 1,
            children: [
              _action(Icons.add_circle, 'New Saving', Colors.emerald),
              _action(Icons.attach_money, 'New Loan', Colors.amber),
              _action(Icons.event, 'Meeting', Colors.blue),
              _action(Icons.volunteer_activism, 'Welfare', Colors.purple),
              _action(Icons.receipt, 'NSSF', Colors.indigo),
              _action(Icons.bar_chart, 'Reports', Colors.teal),
            ],
          ),
        ],
      ),
    );
  }

  Widget _kpi(String label, String value, IconData icon, MaterialColor color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 16, color: color),
                const Spacer(),
              ],
            ),
            const Spacer(),
            Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _portfolioRow(String label, int count, MaterialColor color) {
    final total = _data!['counts']['vslaLoans'] as int;
    final pct = total > 0 ? (count / total * 100).round() : 0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        children: [
          Row(
            children: [
              Text(label, style: const TextStyle(fontSize: 13)),
              const Spacer(),
              Text('$count ($pct%)', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(
            value: total > 0 ? count / total : 0,
            backgroundColor: Colors.grey.shade200,
            color: color,
            minHeight: 4,
          ),
        ],
      ),
    );
  }

  Widget _action(IconData icon, String label, MaterialColor color) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {},
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 11)),
          ],
        ),
      ),
    );
  }
}
