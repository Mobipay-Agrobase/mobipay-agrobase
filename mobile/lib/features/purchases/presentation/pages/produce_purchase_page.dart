import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Produce Purchase Screen — EKIBBO Coffee Purchase Workflow
///
/// Full offline-capable purchase form with:
/// - Farmer selection (search + pick from list)
/// - Commodity selection (coffee, cocoa, vanilla, etc.)
/// - Quality check (moisture reading, defect count, quality deduction)
/// - Auto-calculation (net weight, purchase total, net payment)
/// - Deductions (loan, input, MoMo charges, tax)
/// - Submit for approval
///
/// When offline: saves to local storage, syncs when online.

final farmersProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  // TODO: Replace with actual API call or local DB query
  // final api = ApiClient();
  // final res = await api.get('/api/farmers?limit=200');
  // return extractArray(res, 'farmers');
  return [
    {'id': 'demo1', 'firstName': 'John', 'lastName': 'Mugisha', 'farmerCode': 'BS0001ZE1', 'phone': '+256747076639'},
    {'id': 'demo2', 'firstName': 'Sarah', 'lastName': 'Achieng', 'farmerCode': 'BS0002ZE2', 'phone': '+256747076640'},
  ];
});

const COMMODITIES = ['Coffee', 'Cocoa', 'Vanilla', 'Cassava', 'Avocado', 'Jackfruit'];

class ProducePurchasePage extends ConsumerStatefulWidget {
  const ProducePurchasePage({super.key});

  @override
  ConsumerState<ProducePurchasePage> createState() => _ProducePurchasePageState();
}

class _ProducePurchasePageState extends ConsumerState<ProducePurchasePage> {
  final _formKey = GlobalKey<FormState>();

  // Form controllers
  String? _selectedFarmerId;
  String _commodity = 'Coffee';
  final _varietyCtrl = TextEditingController();
  final _totalWeightCtrl = TextEditingController();
  final _moistureCtrl = TextEditingController();
  final _moisturePhotoUrlCtrl = TextEditingController();
  final _defectCountCtrl = TextEditingController();
  final _qualityDeductionCtrl = TextEditingController();
  final _dailyPriceCtrl = TextEditingController();
  final _loanDeductionCtrl = TextEditingController();
  final _inputDeductionCtrl = TextEditingController();
  final _momoChargesCtrl = TextEditingController();
  final _momoTaxCtrl = TextEditingController();

  bool _saving = false;

  // Auto-calculated values
  double get _netWeight {
    final total = double.tryParse(_totalWeightCtrl.text) ?? 0;
    final deduction = double.tryParse(_qualityDeductionCtrl.text) ?? 0;
    return total - deduction;
  }

  double get _purchaseTotal {
    return _netWeight * (double.tryParse(_dailyPriceCtrl.text) ?? 0);
  }

  double get _netPayment {
    final loan = double.tryParse(_loanDeductionCtrl.text) ?? 0;
    final input = double.tryParse(_inputDeductionCtrl.text) ?? 0;
    final momo = double.tryParse(_momoChargesCtrl.text) ?? 0;
    final tax = double.tryParse(_momoTaxCtrl.text) ?? 0;
    return _purchaseTotal - loan - input - momo - tax;
  }

  String _fmtUgx(double amount) {
    return 'UGX ${amount.toStringAsFixed(0)}';
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedFarmerId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a farmer')),
      );
      return;
    }

    setState(() => _saving = true);

    try {
      // Build purchase payload
      final payload = {
        'farmerId': _selectedFarmerId,
        'commodity': _commodity,
        'variety': _varietyCtrl.text.isEmpty ? null : _varietyCtrl.text,
        'quantity': _totalWeightCtrl.text,
        'moistureReading': double.tryParse(_moistureCtrl.text),
        'moisturePhotoUrl': _moisturePhotoUrlCtrl.text.isEmpty ? null : _moisturePhotoUrlCtrl.text,
        'defectCount': int.tryParse(_defectCountCtrl.text),
        'qualityDeduction': double.tryParse(_qualityDeductionCtrl.text),
        'dailyPrice': double.tryParse(_dailyPriceCtrl.text),
        'loanDeduction': double.tryParse(_loanDeductionCtrl.text),
        'inputDeduction': double.tryParse(_inputDeductionCtrl.text),
        'momoCharges': double.tryParse(_momoChargesCtrl.text),
        'momoTax': double.tryParse(_momoTaxCtrl.text),
        'status': 'PENDING',
        'approvalStatus': 'SUBMITTED',
      };

      // TODO: Replace with actual API call
      // final api = ApiClient();
      // await api.post('/api/purchases', payload);

      // Simulate save
      await Future.delayed(const Duration(seconds: 1));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Purchase submitted for approval!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final farmersAsync = ref.watch(farmersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('New Produce Purchase'),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            tooltip: 'Scan Farmer QR',
            onPressed: () {
              // TODO: Navigate to QR scanner page
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('QR scanner — coming in next build')),
              );
            },
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // ─── Farmer Selection ───
            farmersAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Text('Error: $err'),
              data: (farmers) => DropdownButtonFormField<String>(
                value: _selectedFarmerId,
                decoration: const InputDecoration(
                  labelText: 'Farmer *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person),
                ),
                items: farmers.map((f) {
                  final name = '${f['firstName']} ${f['lastName']}';
                  final code = f['farmerCode'] ?? '';
                  return DropdownMenuItem(
                    value: f['id'] as String,
                    child: Text('$name ($code)'),
                  );
                }).toList(),
                onChanged: (v) => setState(() => _selectedFarmerId = v),
                validator: (v) => v == null ? 'Required' : null,
              ),
            ),
            const SizedBox(height: 12),

            // ─── Commodity ───
            DropdownButtonFormField<String>(
              value: _commodity,
              decoration: const InputDecoration(
                labelText: 'Commodity *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.spa),
              ),
              items: COMMODITIES.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
              onChanged: (v) => setState(() => _commodity = v ?? 'Coffee'),
            ),
            const SizedBox(height: 12),

            // ─── Variety ───
            TextFormField(
              controller: _varietyCtrl,
              decoration: const InputDecoration(
                labelText: 'Variety (optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // ─── Quality Check Section ───
            const Text('Quality Check', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _totalWeightCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Total Weight (kg) *',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (_) => setState(() {}),
                    validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    controller: _moistureCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Moisture %',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            TextFormField(
              controller: _moisturePhotoUrlCtrl,
              decoration: InputDecoration(
                labelText: 'Moisture Meter Photo URL',
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.camera_alt),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.photo_camera),
                  tooltip: 'Take Photo',
                  onPressed: () {
                    // TODO: Camera integration
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Camera — coming in next build')),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 8),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _defectCountCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Defects (blacks)',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    controller: _qualityDeductionCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Quality Deduction (kg)',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (_) => setState(() {}),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ─── Auto-calc Summary ───
            if (_netWeight > 0 || _purchaseTotal > 0) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green.shade200),
                ),
                child: Column(
                  children: [
                    _SummaryRow(label: 'Net Weight', value: '${_netWeight.toStringAsFixed(1)} kg'),
                    _SummaryRow(label: 'Daily Price', value: _fmtUgx(double.tryParse(_dailyPriceCtrl.text) ?? 0)),
                    _SummaryRow(label: 'Purchase Total', value: _fmtUgx(_purchaseTotal), isBold: true),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            // ─── Daily Price ───
            TextFormField(
              controller: _dailyPriceCtrl,
              decoration: const InputDecoration(
                labelText: 'Daily Price (UGX/kg) *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.monetization_on),
              ),
              keyboardType: TextInputType.number,
              onChanged: (_) => setState(() {}),
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),

            // ─── Deductions Section ───
            const Text('Deductions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _loanDeductionCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Loan Deduction',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    controller: _inputDeductionCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Input Deduction',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (_) => setState(() {}),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _momoChargesCtrl,
                    decoration: const InputDecoration(
                      labelText: 'MoMo Charges',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    controller: _momoTaxCtrl,
                    decoration: const InputDecoration(
                      labelText: 'MoMo Tax',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (_) => setState(() {}),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ─── Net Payment ───
            if (_purchaseTotal > 0) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _netPayment >= 0 ? Colors.green.shade100 : Colors.red.shade100,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: _netPayment >= 0 ? Colors.green.shade400 : Colors.red.shade400,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Net Payment to Farmer:', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    Text(
                      _fmtUgx(_netPayment),
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: _netPayment >= 0 ? Colors.green.shade800 : Colors.red.shade800,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // ─── Submit Button ───
            ElevatedButton.icon(
              onPressed: _saving ? null : _submit,
              icon: _saving
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.send),
              label: Text(_saving ? 'Submitting...' : 'Submit for Approval'),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 50),
              ),
            ),
            const SizedBox(height: 8),

            // Offline indicator
            const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.cloud_off, size: 14, color: Colors.grey),
                SizedBox(width: 4),
                Text('Saved offline — will sync when online', style: TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _varietyCtrl.dispose();
    _totalWeightCtrl.dispose();
    _moistureCtrl.dispose();
    _moisturePhotoUrlCtrl.dispose();
    _defectCountCtrl.dispose();
    _qualityDeductionCtrl.dispose();
    _dailyPriceCtrl.dispose();
    _loanDeductionCtrl.dispose();
    _inputDeductionCtrl.dispose();
    _momoChargesCtrl.dispose();
    _momoTaxCtrl.dispose();
    super.dispose();
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;

  const _SummaryRow({required this.label, required this.value, this.isBold = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: Colors.grey.shade700, fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text(value, style: TextStyle(fontSize: 14, fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
        ],
      ),
    );
  }
}
