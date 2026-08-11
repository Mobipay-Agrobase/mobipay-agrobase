import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';

/// Farmer Animal Husbandry Screen — Manage farmer's livestock
///
/// Shows: List of animals with type, count, breed, fodder, housing
/// Supports multiple animal entries

final animalsProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, farmerId) async {
  final res = await ApiClient().get('/api/farmers/$farmerId/animals');
  if (res.statusCode != 200) {
    throw Exception('Failed to load animals (${res.statusCode})');
  }
  final data = jsonDecode(res.body);
  return (data['animals'] as List<dynamic>? ?? [])
      .map((e) => (e as Map<String, dynamic>))
      .toList();
});

class FarmerAnimalsPage extends ConsumerStatefulWidget {
  final String farmerId;
  final String farmerName;

  const FarmerAnimalsPage({
    super.key,
    required this.farmerId,
    required this.farmerName,
  });

  @override
  ConsumerState<FarmerAnimalsPage> createState() => _FarmerAnimalsPageState();
}

class _FarmerAnimalsPageState extends ConsumerState<FarmerAnimalsPage> {
  @override
  Widget build(BuildContext context) {
    final animalsAsync = ref.watch(animalsProvider(widget.farmerId));

    return Scaffold(
      appBar: AppBar(
        title: Text('Animals - ${widget.farmerName}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showAddEditDialog(context),
          ),
        ],
      ),
      body: animalsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
        data: (animals) {
          if (animals.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.pets, size: 64, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text('No animals', style: TextStyle(fontSize: 18, color: Colors.grey.shade600)),
                  const SizedBox(height: 8),
                  Text('Tap + to add animal', style: TextStyle(color: Colors.grey.shade500)),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: animals.length,
            itemBuilder: (context, index) {
              final animal = animals[index];
              final animalType = animal['animalType'] ?? 'Unknown';
              final icon = _getAnimalIcon(animalType);
              final color = _getAnimalColor(animalType);

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: color.shade100,
                    child: Icon(icon, color: color),
                  ),
                  title: Text(animalType),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Count: ${animal['count'] ?? 0}'),
                      if (animal['breedName'] != null)
                        Text('Breed: ${animal['breedName']}'),
                      if (animal['fodder'] != null)
                        Text('Fodder: ${animal['fodder']}'),
                      if (animal['animalHousing'] != null)
                        Text('Housing: ${animal['animalHousing']}'),
                      if (animal['revenue'] != null)
                        Text('Revenue: UGX ${animal['revenue']}'),
                    ],
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit, size: 20),
                        onPressed: () => _showAddEditDialog(context, animal: animal),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, size: 20, color: Colors.red),
                        onPressed: () => _confirmDelete(context, animal),
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

  IconData _getAnimalIcon(String type) {
    switch (type.toLowerCase()) {
      case 'cow':
        return Icons.agriculture;
      case 'hen':
        return Icons.egg;
      case 'goat':
      case 'sheep':
        return Icons.pets;
      case 'pig':
        return Icons.restaurant;
      case 'duck':
        return Icons.water;
      case 'rabbit':
        return Icons.cruelty_free;
      case 'fish':
        return Icons.phishing;
      case 'bee':
        return Icons.bug_report;
      default:
        return Icons.pets;
    }
  }

  MaterialColor _getAnimalColor(String type) {
    switch (type.toLowerCase()) {
      case 'cow':
        return Colors.brown;
      case 'hen':
        return Colors.orange;
      case 'goat':
      case 'sheep':
        return Colors.grey;
      case 'pig':
        return Colors.pink;
      case 'duck':
        return Colors.blue;
      case 'rabbit':
        return Colors.brown;
      case 'fish':
        return Colors.cyan;
      case 'bee':
        return Colors.amber;
      default:
        return Colors.green;
    }
  }

  void _showAddEditDialog(BuildContext context, {Map<String, dynamic>? animal}) {
    final isEditing = animal != null;
    String animalType = animal?['animalType'] ?? 'Cow';
    final countController = TextEditingController(text: (animal?['count'] ?? 1).toString());
    final breedController = TextEditingController(text: animal?['breedName'] ?? '');
    String fodder = animal?['fodder'] ?? '';
    String housing = animal?['animalHousing'] ?? '';
    String purpose = animal?['animalForGrowth'] ?? '';
    final revenueController = TextEditingController(text: animal?['revenue']?.toString() ?? '');

    final animalTypes = ['Cow', 'Hen', 'Goat', 'Sheep', 'Pig', 'Duck', 'Rabbit', 'Fish', 'Bee'];
    final fodderTypes = ['Straw', 'Grass', 'Dry', 'Corn', 'Silage', 'Hay'];
    final housingTypes = ['Shed', 'Hut', 'Barn', 'Free Range', 'Cage'];
    final purposeTypes = ['Meat', 'Milk', 'Eggs', 'Draught', 'Wool', 'Honey'];

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
                  isEditing ? 'Edit Animal' : 'Add Animal',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: animalType,
                  decoration: const InputDecoration(labelText: 'Animal Type *'),
                  items: animalTypes
                      .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                      .toList(),
                  onChanged: (v) => setModalState(() => animalType = v ?? 'Cow'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: countController,
                  decoration: const InputDecoration(labelText: 'Count'),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: breedController,
                  decoration: const InputDecoration(labelText: 'Breed'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: fodder.isEmpty ? null : fodder,
                  decoration: const InputDecoration(labelText: 'Fodder'),
                  items: fodderTypes
                      .map((f) => DropdownMenuItem(value: f, child: Text(f)))
                      .toList(),
                  onChanged: (v) => setModalState(() => fodder = v ?? ''),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: housing.isEmpty ? null : housing,
                  decoration: const InputDecoration(labelText: 'Housing'),
                  items: housingTypes
                      .map((h) => DropdownMenuItem(value: h, child: Text(h)))
                      .toList(),
                  onChanged: (v) => setModalState(() => housing = v ?? ''),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: purpose.isEmpty ? null : purpose,
                  decoration: const InputDecoration(labelText: 'Purpose'),
                  items: purposeTypes
                      .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                      .toList(),
                  onChanged: (v) => setModalState(() => purpose = v ?? ''),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: revenueController,
                  decoration: const InputDecoration(labelText: 'Revenue (UGX)'),
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
                        final data = {
                          'animalType': animalType,
                          'count': int.tryParse(countController.text) ?? 1,
                          'breedName': breedController.text.isNotEmpty ? breedController.text : null,
                          'fodder': fodder.isNotEmpty ? fodder : null,
                          'animalHousing': housing.isNotEmpty ? housing : null,
                          'animalForGrowth': purpose.isNotEmpty ? purpose : null,
                          'revenue': double.tryParse(revenueController.text),
                        };

                        try {
                          if (isEditing) {
                            data['itemId'] = animal['id'];
                            await ApiClient().put('/api/farmers/${widget.farmerId}/animals', body: data);
                          } else {
                            await ApiClient().post('/api/farmers/${widget.farmerId}/animals', body: data);
                          }
                          if (context.mounted) Navigator.pop(context);
                          ref.invalidate(animalsProvider(widget.farmerId));
                        } catch (_) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Failed to save animal'), backgroundColor: Colors.red),
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

  void _confirmDelete(BuildContext context, Map<String, dynamic> animal) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Animal'),
        content: Text('Delete ${animal['animalType']} (${animal['count']} count)?'),
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
                  '/api/farmers/${widget.farmerId}/animals?itemId=${animal['id']}',
                );
              } catch (_) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Failed to delete animal'), backgroundColor: Colors.red),
                  );
                }
              }
              if (context.mounted) Navigator.pop(context);
              ref.invalidate(animalsProvider(widget.farmerId));
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
