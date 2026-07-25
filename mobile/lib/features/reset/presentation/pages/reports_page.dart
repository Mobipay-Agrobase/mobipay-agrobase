import 'package:flutter/material.dart';
import '../data/services/reset_api.dart';

class ReportsPage extends StatefulWidget {
  const ReportsPage({super.key});
  @override
  State<ReportsPage> createState() => _ReportsPageState();
}

class _ReportsPageState extends State<ReportsPage> {
  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _settlementFilter;
  String? _partnerFilter;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final data = await ResetApi.getReports(settlement: _settlementFilter, partner: _partnerFilter);
      setState(() { _data = data; _loading = false; });
    } catch { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Consortium Reports'), backgroundColor: const Color(0xFF059669), foregroundColor: Colors.white),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Unit Metrics
                  const Text('Unit Metrics', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  GridView.count(
                    crossAxisCount: 3,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: 1.0,
                    children: [
                      _metricCard('Beneficiaries', '${_data?['unitMetrics']?['totalBeneficiaries'] ?? 0}'),
                      _metricCard('Households', '${_data?['unitMetrics']?['totalHouseholds'] ?? 0}'),
                      _metricCard('Vouchers', '${_data?['unitMetrics']?['totalVouchers'] ?? 0}'),
                      _metricCard('Redemption', '${_data?['unitMetrics']?['redemptionRate'] ?? 0}%'),
                      _metricCard('Cash Confirmed', '${_data?['unitMetrics']?['confirmationRate'] ?? 0}%'),
                      _metricCard('Merchants', '${_data?['unitMetrics']?['totalMerchants'] ?? 0}'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // By Settlement
                  const Text('Beneficiaries by Settlement', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: (_data?['demographics']?['bySettlement'] as List?)?.map((s) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 3),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(s['name'] ?? '', style: const TextStyle(fontSize: 13)),
                              Text('${s['count'] ?? 0}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        )).toList() ?? [],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Voucher Status
                  const Text('Voucher Status', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: (_data?['vouchers']?['byStatus'] as List?)?.map((v) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 3),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(v['name'] ?? '', style: const TextStyle(fontSize: 13)),
                              Text('${v['count'] ?? 0} (UGX ${v['amount'] ?? 0})', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        )).toList() ?? [],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Agent Performance
                  const Text('Field Agent Performance', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...((_data?['agents'] as List?) ?? []).map((a) => Card(
                    margin: const EdgeInsets.only(bottom: 4),
                    child: ListTile(
                      dense: true,
                      title: Text(a['fullName'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      subtitle: Text('${a['settlement']} · ${a['beneficiariesEnrolled']} enrolled · ${a['vouchersDistributed']} vouchers', style: const TextStyle(fontSize: 11)),
                      trailing: Text(a['agentType'] ?? '', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                    ),
                  )),
                ],
              ),
            ),
    );
  }

  Widget _metricCard(String label, String value) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
