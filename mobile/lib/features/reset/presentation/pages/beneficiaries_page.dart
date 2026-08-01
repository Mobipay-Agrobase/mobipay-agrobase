import 'package:flutter/material.dart';
import 'package:agrobase_mobile/features/reset/data/services/reset_api.dart';

class BeneficiariesPage extends StatefulWidget {
  const BeneficiariesPage({super.key});
  @override
  State<BeneficiariesPage> createState() => _BeneficiariesPageState();
}

class _BeneficiariesPageState extends State<BeneficiariesPage> {
  List<dynamic> _beneficiaries = [];
  bool _loading = true;
  int _page = 1;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ResetApi.getBeneficiaries(page: _page);
      setState(() {
        _beneficiaries = data['beneficiaries'] ?? [];
        _loading = false;
      });
    } catch (e) { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Beneficiaries'), backgroundColor: const Color(0xFF059669), foregroundColor: Colors.white),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                itemCount: _beneficiaries.length,
                itemBuilder: (ctx, i) {
                  final b = _beneficiaries[i];
                  return Card(
                    margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    child: ListTile(
                      leading: CircleAvatar(backgroundColor: Colors.green.withOpacity(0.1), child: Text(b['fullName']?[0] ?? '?')),
                      title: Text(b['fullName'] ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${b['beneficiaryId']} · ${b['settlement']}', style: const TextStyle(fontSize: 11)),
                          Text('Wallet: UGX ${b['walletBalance']} | Voucher: UGX ${b['voucherBalance']}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                        ],
                      ),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(color: Colors.green.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                        child: Text(b['status'] ?? '', style: TextStyle(fontSize: 10, color: Colors.green.withOpacity(0.8))),
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
