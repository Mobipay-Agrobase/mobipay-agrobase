import 'package:flutter/material.dart';
import 'package:agrobase_mobile/features/reset/data/services/reset_api.dart';

class MerchantsPage extends StatefulWidget {
  const MerchantsPage({super.key});
  @override
  State<MerchantsPage> createState() => _MerchantsPageState();
}

class _MerchantsPageState extends State<MerchantsPage> {
  List<dynamic> _merchants = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final data = await ResetApi.getMerchants();
      setState(() { _merchants = data['merchants'] ?? []; _loading = false; });
    } catch (e) { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Merchants'), backgroundColor: const Color(0xFF059669), foregroundColor: Colors.white),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                itemCount: _merchants.length,
                itemBuilder: (ctx, i) {
                  final m = _merchants[i];
                  return Card(
                    margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    child: ListTile(
                      leading: CircleAvatar(backgroundColor: Colors.blue.shade50, child: const Icon(Icons.store, color: Colors.blue)),
                      title: Text(m['businessName'] ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${m['ownerName']} · ${m['settlement']}', style: const TextStyle(fontSize: 11)),
                          Text('${m['businessType']} · Payout: UGX ${m['payoutAmount']}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                        ],
                      ),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: m['status'] == 'APPROVED' ? Colors.green.withOpacity(0.2) : Colors.amber.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          m['status'] ?? '',
                          style: TextStyle(
                            fontSize: 9,
                            color: m['status'] == 'APPROVED' ? Colors.green.withOpacity(0.8) : Colors.amber.withOpacity(0.8),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
