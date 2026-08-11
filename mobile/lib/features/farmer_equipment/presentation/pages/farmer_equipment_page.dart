import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';

/// Farmer Equipment Screen — Manage farmer's farm equipment
///
/// Shows: List of equipment with name, count, year of manufacture/purchase
/// Supports multiple equipment items

final equipmentProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, farmerId) async {
  final res = await ApiClient().get('/api/farmers/$farmerId/equipment');
  if (res.statusCode != 200) {
    throw Exception('Failed to load equipment (${res.statusCode})');
  }
  final data = jsonDecode(res.body);
  return (data['equipment'] as List<dynamic>? ?? [])
      .map((e) => (e as Map<String, dynamic>))
      .toList();
});

class FarmerEquipmentPage extends ConsumerStatefulWidget {
  final String farmerId;
  final String farmerName;

  const FarmerEquipmentPage({
    super.key,
    required this.farmerId,
    required this.farmerName,
  });

  @override
  ConsumerState<FarmerEquipmentPage> createState() => _FarmerEquipmentPageState();
}

class _FarmerEquipmentPageState extends ConsumerState<FarmerEquipmentPage> {
  @override
  Widget build(BuildContext context) {
    final equipmentAsync = ref.watch(equipmentProvider(widget.farmerId));

    return Scaffold(
      appBar: AppBar(
        title: Text('Equipment - ${widget.farmerName}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showAddEditDialog(context),
          ),
        ],
      ),
      body: equipmentAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
        data: (equipment) {
          if (equipment.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.agriculture, size: 64, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text('No equipment', style: TextStyle(fontSize: 18, color: Colors.grey.shade600)),
                  const SizedBox(height: 8),
                  Text('Tap + to add equipment', style: TextStyle(color: Colors.grey.shade500)),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: equipment.length,
            itemBuilder: (context, index) {
              final item = equipment[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Colors.brown.shade100,
                    child: const Icon(Icons.agriculture, color: Colors.brown),
                  ),
                  title: Text(item['equipmentName'] ?? 'Unknown'),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Count: ${item['count'] ?? 1}'),
                      if (item['yearOfManufacture'] != null)
                        Text('Manufactured: ${item['yearOfManufacture']}'),
                      if (item['yearOfPurchase'] != null)
                        Text('Purchased: ${item['yearOfPurchase']}'),
                    ],
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit, size: 20),
                        onPressed: () => _showAddEditDialog(context, equipment: item),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, size: 20, color: Colors.red),
                        onPressed: () => _confirmDelete(context, item),
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

  void _showAddEditDialog(BuildContext context, {Map<String, dynamic>? equipment}) {
    final isEditing = equipment != null;
    final nameController = TextEditingController(text: equipment?['equipmentName'] ?? '');
    final countController = TextEditingController(text: (equipment?['count'] ?? 1).toString());
    final yearMfgController = TextEditingController(text: equipment?['yearOfManufacture']?.toString() ?? '');
    final yearPurchaseController = TextEditingController(text: equipment?['yearOfPurchase']?.toString() ?? '');

    final equipmentItems = [
      'Tractor', 'Power Tiller', 'Sprayer', 'Harvester', 'Irrigation Pump',
      'Hand Tools', 'Ox Plow', 'Thresher', 'Drying Yard', 'Storage Bin',
    ];

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
                  isEditing ? 'Edit Equipment' : 'Add Equipment',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: equipmentItems.contains(nameController.text) ? nameController.text : null,
                  decoration: const InputDecoration(labelText: 'Equipment Name *'),
                  items: equipmentItems
                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                      .toList(),
                  onChanged: (v) => nameController.text = v ?? '',
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Equipment Name *'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: countController,
                  decoration: const InputDecoration(labelText: 'Count'),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: yearMfgController,
                  decoration: const InputDecoration(labelText: 'Year of Manufacture'),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: yearPurchaseController,
                  decoration: const InputDecoration(labelText: 'Year of Purchase'),
                  keyboardType: TextInputType.number,
                ),
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
                        if (nameController.text.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Equipment name is required')),
                          );
                          return;
                        }

                        final data = {
                          'equipmentName': nameController.text,
                          'count': int.tryParse(countController.text) ?? 1,
                          'yearOfManufacture': int.tryParse(yearMfgController.text),
                          'yearOfPurchase': int.tryParse(yearPurchaseController.text),
                        };

                        try {
                          if (isEditing) {
                            data['itemId'] = equipment['id'];
                            await ApiClient().put('/api/farmers/${widget.farmerId}/equipment', body: data);
                          } else {
                            await ApiClient().post('/api/farmers/${widget.farmerId}/equipment', body: data);
                          }
                          if (context.mounted) Navigator.pop(context);
                          ref.invalidate(equipmentProvider(widget.farmerId));
                        } catch (_) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Failed to save equipment'), backgroundColor: Colors.red),
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

  void _confirmDelete(BuildContext context, Map<String, dynamic> equipment) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Equipment'),
        content: Text('Delete ${equipment['equipmentName']}?'),
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
                  '/api/farmers/${widget.farmerId}/equipment?itemId=${equipment['id']}',
                );
              } catch (_) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Failed to delete equipment'), backgroundColor: Colors.red),
                  );
                }
              }
              if (context.mounted) Navigator.pop(context);
              ref.invalidate(equipmentProvider(widget.farmerId));
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
