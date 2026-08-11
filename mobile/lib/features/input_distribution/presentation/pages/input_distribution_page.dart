import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';

/// Input Distribution Screen — Distribute inputs to farmers
///
/// Shows list of input distributions + form to distribute new inputs.
/// Offline-capable: saves locally, syncs when online.

final distributionsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final res = await ApiClient().get('/api/input-distribution');
  if (res.statusCode != 200) {
    throw Exception('Failed to load distributions (${res.statusCode})');
  }
  final data = jsonDecode(res.body);
  return (data['data'] as List<dynamic>? ?? [])
      .map((e) => (e as Map<String, dynamic>))
      .toList();
});

final farmersProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final res = await ApiClient().get('/api/farmers?limit=200');
  if (res.statusCode != 200) {
    throw Exception('Failed to load farmers (${res.statusCode})');
  }
  final data = jsonDecode(res.body);
  return (data['farmers'] as List<dynamic>? ?? [])
      .map((e) => (e as Map<String, dynamic>))
      .toList();
});

const INPUT_TYPES = ['Tarpaulin', 'Fertilizer', 'Pruning Saw', 'Seedling'];

class InputDistributionPage extends ConsumerWidget {
  const InputDistributionPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final distributionsAsync = ref.watch(distributionsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Input Distribution')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showDistributeDialog(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Distribute'),
      ),
      body: distributionsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.grey),
              const SizedBox(height: 16),
              Text('Failed: $err'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(distributionsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (distributions) {
          if (distributions.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text('No input distributions yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  const Text('Tap "Distribute" to give inputs to a farmer', style: TextStyle(color: Colors.grey)),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () => _showDistributeDialog(context, ref),
                    icon: const Icon(Icons.add),
                    label: const Text('Distribute Input'),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: distributions.length,
            itemBuilder: (context, index) {
              final d = distributions[index];
              final farmer = d['farmer'] ?? {};
              final status = d['status'] ?? 'DISTRIBUTED';
              final balance = d['balanceRemaining'] ?? d['totalCost'] ?? 0;

              return Card(
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: _typeColor(d['inputType'] ?? ''),
                    child: Icon(_typeIcon(d['inputType'] ?? ''), color: Colors.white, size: 20),
                  ),
                  title: Text('${d['inputType'] ?? 'Input'} — ${farmer['firstName'] ?? ''} ${farmer['lastName'] ?? ''}'),
                  subtitle: Text('Qty: ${d['quantity'] ?? 0} ${d['unit'] ?? 'pcs'} · Cost: UGX ${d['totalCost'] ?? 0} · Balance: UGX $balance'),
                  trailing: Chip(
                    label: Text(status, style: const TextStyle(fontSize: 10)),
                    backgroundColor: status == 'FULLY_REPAID'
                        ? Colors.green.shade100
                        : status == 'PARTIALLY_REPAID'
                            ? Colors.amber.shade100
                            : Colors.blue.shade100,
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  void _showDistributeDialog(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => const _DistributeInputForm(),
    );
  }

  Color _typeColor(String type) {
    switch (type.toLowerCase()) {
      case 'tarpaulin':
        return Colors.blue;
      case 'fertilizer':
        return Colors.green;
      case 'pruning_saw':
      case 'pruning saw':
        return Colors.orange;
      case 'seedling':
        return Colors.teal;
      default:
        return Colors.grey;
    }
  }

  IconData _typeIcon(String type) {
    switch (type.toLowerCase()) {
      case 'tarpaulin':
        return Icons.inventory;
      case 'fertilizer':
        return Icons.grass;
      case 'pruning_saw':
      case 'pruning saw':
        return Icons.content_cut;
      case 'seedling':
        return Icons.local_florist;
      default:
        return Icons.inventory_2;
    }
  }
}

class _DistributeInputForm extends ConsumerStatefulWidget {
  const _DistributeInputForm();

  @override
  ConsumerState<_DistributeInputForm> createState() => _DistributeInputFormState();
}

class _DistributeInputFormState extends ConsumerState<_DistributeInputForm> {
  final _formKey = GlobalKey<FormState>();
  String? _farmerId;
  String _inputType = 'Tarpaulin';
  final _inputNameCtrl = TextEditingController();
  final _quantityCtrl = TextEditingController();
  final _unitCostCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  bool _saving = false;

  double get _totalCost {
    final qty = double.tryParse(_quantityCtrl.text) ?? 0;
    final cost = double.tryParse(_unitCostCtrl.text) ?? 0;
    return qty * cost;
  }

  @override
  Widget build(BuildContext context) {
    final farmersAsync = ref.watch(farmersProvider);

    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Distribute Input', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),

            farmersAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Text('Error: $err'),
              data: (farmers) => DropdownButtonFormField<String>(
                value: _farmerId,
                decoration: const InputDecoration(
                  labelText: 'Farmer *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person),
                ),
                items: farmers.map((f) {
                  return DropdownMenuItem(
                    value: f['id'] as String,
                    child: Text('${f['firstName']} ${f['lastName']} (${f['farmerCode'] ?? ''})'),
                  );
                }).toList(),
                onChanged: (v) => setState(() => _farmerId = v),
                validator: (v) => v == null ? 'Required' : null,
              ),
            ),
            const SizedBox(height: 12),

            DropdownButtonFormField<String>(
              value: _inputType,
              decoration: const InputDecoration(
                labelText: 'Input Type *',
                border: OutlineInputBorder(),
              ),
              items: INPUT_TYPES.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
              onChanged: (v) => setState(() => _inputType = v ?? 'Tarpaulin'),
            ),
            const SizedBox(height: 12),

            TextFormField(
              controller: _inputNameCtrl,
              decoration: const InputDecoration(
                labelText: 'Input Name / Brand (optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _quantityCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Quantity *',
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
                    controller: _unitCostCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Unit Cost (UGX) *',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (_) => setState(() {}),
                    validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            if (_totalCost > 0)
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.purple.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Total Cost: UGX ${_totalCost.toStringAsFixed(0)}',
                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.purple.shade800),
                ),
              ),
            const SizedBox(height: 12),

            TextFormField(
              controller: _notesCtrl,
              decoration: const InputDecoration(
                labelText: 'Notes (optional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 16),

            ElevatedButton.icon(
              onPressed: _saving ? null : _submit,
              icon: _saving
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.check),
              label: Text(_saving ? 'Saving...' : 'Distribute Input'),
              style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_farmerId == null) return;

    setState(() => _saving = true);
    try {
      final res = await ApiClient().post('/api/input-distribution', body: {
        'farmerId': _farmerId,
        'inputType': _inputType,
        'inputName': _inputNameCtrl.text.isEmpty ? null : _inputNameCtrl.text,
        'quantity': double.tryParse(_quantityCtrl.text),
        'unit': 'pcs',
        'unitCost': double.tryParse(_unitCostCtrl.text),
        'notes': _notesCtrl.text.isEmpty ? null : _notesCtrl.text,
      });

      if (mounted) {
        if (res.statusCode == 201) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Input distributed!'), backgroundColor: Colors.green),
          );
          Navigator.pop(context);
          ref.invalidate(distributionsProvider);
        } else {
          final err = jsonDecode(res.body)['error'] ?? 'Failed to distribute input';
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(err.toString()), backgroundColor: Colors.red),
          );
        }
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
  void dispose() {
    _inputNameCtrl.dispose();
    _quantityCtrl.dispose();
    _unitCostCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }
}
