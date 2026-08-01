import 'package:flutter/material.dart';
import 'package:agrobase_mobile/features/reset/data/services/reset_api.dart';

class VouchersPage extends StatefulWidget {
  const VouchersPage({super.key});
  @override
  State<VouchersPage> createState() => _VouchersPageState();
}

class _VouchersPageState extends State<VouchersPage> {
  List<dynamic> _vouchers = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final data = await ResetApi.getVouchers();
      setState(() { _vouchers = data['vouchers'] ?? []; _loading = false; });
    } catch (e) { setState(() => _loading = false); }
  }

  Color _statusColor(String status) {
    if (status == 'ISSUED') return Colors.amber;
    if (status == 'REDEEMED') return Colors.green;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Vouchers'), backgroundColor: const Color(0xFF059669), foregroundColor: Colors.white),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                itemCount: _vouchers.length,
                itemBuilder: (ctx, i) {
                  final v = _vouchers[i];
                  return Card(
                    margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    child: ListTile(
                      leading: CircleAvatar(backgroundColor: _statusColor(v['status'] ?? '').withOpacity(0.1), child: Icon(Icons.receipt, color: _statusColor(v['status'] ?? ''))),
                      title: Text(v['voucherCode'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, fontFamily: 'monospace')),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${v['beneficiary']?['fullName'] ?? 'Unknown'} · ${v['type']}', style: const TextStyle(fontSize: 11)),
                          Text('UGX ${v['amount']} · Expires ${v['expiryDate']?.toString().substring(0, 10) ?? ''}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                        ],
                      ),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(color: _statusColor(v['status'] ?? '').withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                        child: Text(v['status'] ?? '', style: TextStyle(fontSize: 9, color: _statusColor(v['status'] ?? '').withOpacity(0.8), fontWeight: FontWeight.w600)),
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
