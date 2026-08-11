import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';

/// Crop Stage Library — Mobile Screen
/// Shows the 10 crop verticals (CoffeeCore, LiveCore, CropCore, etc.)
/// and their stage definitions.

final cropVerticalsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final res = await ApiClient().get('/api/crop-stages/definitions');
  if (res.statusCode != 200) {
    throw Exception('Failed to load crop verticals (${res.statusCode})');
  }
  final data = jsonDecode(res.body);
  final list = (data['available'] as List<dynamic>? ?? [])
      .map((e) => (e as Map<String, dynamic>))
      .toList();

  const icons = <String, String>{
    'coffeecore': '☕', 'livecore': '🐄', 'cropcore': '🌽', 'orchardcore': '🍎',
    'vegcore': '🥬', 'floracore': '🌺', 'aquacore': '🐟', 'forestcore': '🌳',
    'timbercore': '🌲', 'mangrovecore': '🌿',
  };
  const labels = <String, String>{
    'coffeecore': 'Coffee & Cocoa', 'livecore': 'Livestock & Dairy', 'cropcore': 'Field Crops',
    'orchardcore': 'Orchard Fruits', 'vegcore': 'Vegetables', 'floracore': 'Floriculture',
    'aquacore': 'Aquaculture', 'forestcore': 'Forestry', 'timbercore': 'Timber Tracking',
    'mangrovecore': 'Mangrove Restoration',
  };

  // Map API records to the keys this screen renders.
  return list.map((v) {
    final key = v['vertical']?.toString().toLowerCase() ?? '';
    return {
      'id': key,
      'name': v['vertical'],
      'label': labels[key] ?? (v['cropTypes'] is List ? (v['cropTypes'] as List).join(', ') : ''),
      'icon': icons[key] ?? '🌿',
      'stages': v['totalStages'] ?? 0,
      'fields': v['totalFields'] ?? 0,
    };
  }).toList();
});

class CropStagesPage extends ConsumerWidget {
  const CropStagesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final verticalsAsync = ref.watch(cropVerticalsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Crop Stage Library')),
      body: verticalsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Failed: $err')),
        data: (verticals) => GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.1,
          ),
          itemCount: verticals.length,
          itemBuilder: (context, index) {
            final v = verticals[index];
            return Card(
              child: InkWell(
                onTap: () {
                  Navigator.pushNamed(context, '/crop-stages/detail', arguments: v);
                },
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(v['icon'] as String, style: const TextStyle(fontSize: 32)),
                      const SizedBox(height: 8),
                      Text(
                        v['name'] as String,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      Text(
                        v['label'] as String,
                        style: const TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Chip(
                            label: Text('${v['stages']} stages'),
                            padding: EdgeInsets.zero,
                            visualDensity: VisualDensity.compact,
                          ),
                          const SizedBox(width: 4),
                          Chip(
                            label: Text('${v['fields']} fields'),
                            padding: EdgeInsets.zero,
                            visualDensity: VisualDensity.compact,
                          ),
                        ],
                      ),
                    ],
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
