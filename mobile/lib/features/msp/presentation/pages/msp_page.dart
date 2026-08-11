import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';

/// Mazao Safi Practices (MSP) — Mobile Screen
/// Shows the 10 crop verticals and their 1 Must + 5 Reduce practices.
/// Field officers can log practice adoptions for farmers.

final mspVariantsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final res = await ApiClient().get('/api/farm5x/definitions');
  if (res.statusCode != 200) {
    throw Exception('Failed to load MSP variants (${res.statusCode})');
  }
  final data = jsonDecode(res.body);
  final list = (data['summary'] as List<dynamic>? ?? [])
      .map((e) => (e as Map<String, dynamic>))
      .toList();
  // Map API fields to the keys this screen renders.
  return list.map((v) {
    return {
      'variant': v['variant'],
      'crop': v['cropLabel'],
      'icon': v['icon'],
      'target': v['targetReduction'],
      'mandatoryPractice': v['mandatoryPractice'],
      'reducePractices': v['reducePractices'],
    };
  }).toList();
});

class MspPage extends ConsumerWidget {
  const MspPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final variantsAsync = ref.watch(mspVariantsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mazao Safi Practices'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              Navigator.pushNamed(context, '/msp/log');
            },
            tooltip: 'Log Practice Adoption',
          ),
        ],
      ),
      body: variantsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.grey),
              const SizedBox(height: 16),
              Text('Failed to load: $err'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(mspVariantsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (variants) => ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: variants.length,
          itemBuilder: (context, index) {
            final v = variants[index];
            return Card(
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: Colors.green.shade50,
                  child: Text(v['icon'] as String, style: const TextStyle(fontSize: 20)),
                ),
                title: Text('${v['variant']} — ${v['crop']}'),
                subtitle: Text('Target: ${v['target']}'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // Navigate to variant detail
                  Navigator.pushNamed(
                    context,
                    '/msp/detail',
                    arguments: v,
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }
}

/// MSP Detail Page — shows 1 Must + 5 Reduce practices for a variant
final mspPracticesProvider = FutureProvider.family<List<Map<String, dynamic>>, String>(
  (ref, variant) async {
    final res = await ApiClient().get('/api/farm5x/definitions?variant=$variant');
    if (res.statusCode != 200) {
      throw Exception('Failed to load practices (${res.statusCode})');
    }
    final data = jsonDecode(res.body);
    return (data['practices'] as List<dynamic>? ?? [])
        .map((e) => (e as Map<String, dynamic>))
        .toList();
  },
);

class MspDetailPage extends ConsumerWidget {
  const MspDetailPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final variant = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final practicesAsync = ref.watch(mspPracticesProvider((variant?['variant'] ?? '').toString()));

    return Scaffold(
      appBar: AppBar(
        title: Text(variant?['variant'] ?? 'MSP Detail'),
      ),
      body: practicesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Failed to load practices: $err'),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.refresh(mspPracticesProvider((variant?['variant'] ?? '').toString())),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (practices) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              color: Colors.green.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(variant?['icon'] ?? '', style: const TextStyle(fontSize: 32)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${variant?['variant']} — ${variant?['crop']}',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              Text('Target: ${variant?['target']}'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Practices',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            if (practices.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: Text('No practices defined')),
              )
            else
              ...practices.map((p) {
                final label = p['label'] ?? 'Practice';
                final code = p['code'] ?? '';
                final isMust = p['isMandatory'] == true || p['mandatory'] == true || code.toString().startsWith('M');
                return _buildPracticeTile(code.toString(), label.toString(), isMust);
              }),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pushNamed(context, '/msp/log', arguments: variant);
              },
              icon: const Icon(Icons.add),
              label: const Text('Log Adoption'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPracticeTile(String code, String title, bool isMust) {
    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isMust ? Colors.green : Colors.grey.shade200,
          child: Icon(
            isMust ? Icons.star : Icons.eco,
            color: isMust ? Colors.white : Colors.green,
          ),
        ),
        title: Text(title),
        subtitle: Text(code),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}
