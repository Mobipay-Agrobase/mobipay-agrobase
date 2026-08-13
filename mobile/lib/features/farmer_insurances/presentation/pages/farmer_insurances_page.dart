import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';

/// Farmer Insurance Screen — Manage farmer's insurance policies
///
/// Shows: List of insurance policies (Life, Health, Crop, Social, Other)
/// Supports multiple policies with type, provider, amount, dates

final insurancesProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, farmerId) async {
  final res = await ApiClient().get('/api/farmers/$farmerId/insurances');
  if (res.statusCode != 200) {
    throw Exception('Failed to load insurances (${res.statusCode})');
  }
  final data = jsonDecode(res.body);
  return (data['insurances'] as List<dynamic>? ?? [])
      .map((e) => (e as Map<String, dynamic>))
      .toList();
});

class FarmerInsurancesPage extends ConsumerStatefulWidget {
  final String farmerId;
  final String farmerName;

  const FarmerInsurancesPage({
    super.key,
    required this.farmerId,
    required this.farmerName,
  });

  @override
  ConsumerState<FarmerInsurancesPage> createState() => _FarmerInsurancesPageState();
}

class _FarmerInsurancesPageState extends ConsumerState<FarmerInsurancesPage> {
  @override
  Widget build(BuildContext context) {
    final insurancesAsync = ref.watch(insurancesProvider(widget.farmerId));

    return Scaffold(
      appBar: AppBar(
        title: Text('Insurance - ${widget.farmerName}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showAddEditDialog(context),
          ),
        ],
      ),
      body: insurancesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
        data: (insurances) {
          if (insurances.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.shield, size: 64, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text('No insurance policies', style: TextStyle(fontSize: 18, color: Colors.grey.shade600)),
                  const SizedBox(height: 8),
                  Text('Tap + to add insurance', style: TextStyle(color: Colors.grey.shade500)),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: insurances.length,
            itemBuilder: (context, index) {
              final insurance = insurances[index];
              final type = insurance['insuranceType'] ?? 'Other';
              final color = _getTypeColor(type);

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: color.shade100,
                    child: Icon(_getTypeIcon(type), color: color),
                  ),
                  title: Text('$type Insurance'),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (insurance['provider'] != null)
                        Text('Provider: ${insurance['provider']}'),
                      if (insurance['amount'] != null)
                        Text('Amount: UGX ${insurance['amount']}'),
                      if (insurance['enrolledDate'] != null)
                        Text('Enrolled: ${insurance['enrolledDate']?.toString().split('T')[0]}'),
                      if (insurance['endDate'] != null)
                        Text('Expires: ${insurance['endDate']?.toString().split('T')[0]}'),
                      if (insurance['cropInsured'] != null)
                        Text('Crop: ${insurance['cropInsured']}'),
                    ],
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit, size: 20),
                        onPressed: () => _showAddEditDialog(context, insurance: insurance),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, size: 20, color: Colors.red),
                        onPressed: () => _confirmDelete(context, insurance),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  MaterialColor _getTypeColor(String type) {
    switch (type.toLowerCase()) {
      case 'life':
        return Colors.red;
      case 'health':
        return Colors.green;
      case 'crop':
        return Colors.orange;
      case 'social':
        return Colors.blue;
      default:
        return Colors.purple;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type.toLowerCase()) {
      case 'life':
        return Icons.favorite;
      case 'health':
        return Icons.local_hospital;
      case 'crop':
        return Icons.agriculture;
      case 'social':
        return Icons.people;
      default:
        return Icons.shield;
    }
  }

  void _showAddEditDialog(BuildContext context, {Map<String, dynamic>? insurance}) {
    final isEditing = insurance != null;
    String insuranceType = insurance?['insuranceType'] ?? 'Life';
    final providerController = TextEditingController(text: insurance?['provider'] ?? '');
    final amountController = TextEditingController(text: insurance?['amount']?.toString() ?? '');
    final enrolledDateController = TextEditingController(
      text: insurance?['enrolledDate']?.toString().split('T')[0] ?? '',
    );
    final endDateController = TextEditingController(
      text: insurance?['endDate']?.toString().split('T')[0] ?? '',
    );
    final cropInsuredController = TextEditingController(text: insurance?['cropInsured'] ?? '');
    final areaInsuredController = TextEditingController(text: insurance?['areaInsured']?.toString() ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 16,
            right: 16,
            top: 16,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isEditing ? 'Edit Insurance' : 'Add Insurance',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: insuranceType,
                  decoration: const InputDecoration(labelText: 'Insurance Type *'),
                  items: ['Life', 'Health', 'Crop', 'Social', 'Other']
                      .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                      .toList(),
                  onChanged: (v) => setModalState(() => insuranceType = v ?? 'Life'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: providerController,
                  decoration: const InputDecoration(labelText: 'Provider'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: amountController,
                  decoration: const InputDecoration(labelText: 'Amount'),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: enrolledDateController,
                  decoration: const InputDecoration(labelText: 'Enrolled Date'),
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now(),
                      firstDate: DateTime(2000),
                      lastDate: DateTime.now(),
                    );
                    if (date != null) {
                      enrolledDateController.text = date.toIso8601String().split('T')[0];
                    }
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: endDateController,
                  decoration: const InputDecoration(labelText: 'End Date'),
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now().add(const Duration(days: 365)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime(2050),
                    );
                    if (date != null) {
                      endDateController.text = date.toIso8601String().split('T')[0];
                    }
                  },
                ),
                if (insuranceType == 'Crop') ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: cropInsuredController,
                    decoration: const InputDecoration(labelText: 'Crop Insured'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: areaInsuredController,
                    decoration: const InputDecoration(labelText: 'Area Insured (ha)'),
                    keyboardType: TextInputType.number,
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                    ElevatedButton(
                      onPressed: () async {
                        final data = {
                          'insuranceType': insuranceType,
                          'provider': providerController.text,
                          'amount': double.tryParse(amountController.text),
                          'enrolledDate': enrolledDateController.text.isNotEmpty
                              ? enrolledDateController.text
                              : null,
                          'endDate': endDateController.text.isNotEmpty
                              ? endDateController.text
                              : null,
                          'cropInsured': cropInsuredController.text.isNotEmpty
                              ? cropInsuredController.text
                              : null,
                          'areaInsured': double.tryParse(areaInsuredController.text),
                        };

                        try {
                          if (isEditing) {
                            data['itemId'] = insurance['id'];
                            await ApiClient().put('/api/farmers/${widget.farmerId}/insurances', body: data);
                          } else {
                            await ApiClient().post('/api/farmers/${widget.farmerId}/insurances', body: data);
                          }
                          if (context.mounted) Navigator.pop(context);
                          ref.invalidate(insurancesProvider(widget.farmerId));
                        } catch (_) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Failed to save insurance'), backgroundColor: Colors.red),
                            );
                          }
                        }
                      },
                      child: Text(isEditing ? 'Update' : 'Add'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _confirmDelete(BuildContext context, Map<String, dynamic> insurance) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Insurance'),
        content: Text('Delete ${insurance['insuranceType']} insurance from ${insurance['provider']}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              try {
                await ApiClient().delete(
                  '/api/farmers/${widget.farmerId}/insurances?itemId=${insurance['id']}',
                );
              } catch (_) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Failed to delete insurance'), backgroundColor: Colors.red),
                  );
                }
              }
              if (context.mounted) Navigator.pop(context);
              ref.invalidate(insurancesProvider(widget.farmerId));
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
