/**
 * VSLA V2 — Cross-Module Integrations Page (Mobile)
 * Shows all integration transactions (input purchase, product sale, marketplace,
 * insurance, NSSF, carbon credits) for the member's group.
 */
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../data/services/vsla_v2_api.dart';

class IntegrationsPage extends StatefulWidget {
  final String groupId;

  const IntegrationsPage({super.key, required this.groupId});

  @override
  State<IntegrationsPage> createState() => _IntegrationsPageState();
}

class _IntegrationsPageState extends State<IntegrationsPage> {
  List<dynamic> _entries = [];
  Map<String, dynamic> _summary = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await http.get(
        Uri.parse('${VslaV2Api.baseUrl}/api/vsla-v2/integrations?limit=50'),
        headers: VslaV2Api._headers,
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          _entries = data['entries'] ?? [];
          _summary = data['summary'] ?? {};
          _loading = false;
        });
      }
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('VSLA Integrations'),
        backgroundColor: const Color(0xFF059669),
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Summary cards
                  if (_summary.isNotEmpty) ...[
                    const Text('Summary', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _summary.entries.map((e) {
                        final type = e.key;
                        final data = e.value;
                        final count = data['count'] ?? 0;
                        final totalIn = data['totalIn'] ?? 0;
                        final totalOut = data['totalOut'] ?? 0;
                        return Card(
                          child: Container(
                            width: 160,
                            padding: const EdgeInsets.all(10),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(type.replaceAll('_', ' '), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                                Text('$count transactions', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                if (totalIn > 0) Text('In: UGX ${totalIn.toLocaleString()}', style: const TextStyle(fontSize: 10, color: Colors.green)),
                                if (totalOut > 0) Text('Out: UGX ${totalOut.toLocaleString()}', style: const TextStyle(fontSize: 10, color: Colors.red)),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),
                  ],
                  
                  // Transaction list
                  const Text('Transaction History', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  if (_entries.isEmpty)
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            Icon(Icons.swap_horiz, size: 48, color: Colors.grey.shade400),
                            const SizedBox(height: 8),
                            const Text('No cross-module transactions yet', style: TextStyle(color: Colors.grey)),
                            const SizedBox(height: 4),
                            const Text('Input purchases, product sales, insurance, NSSF, and carbon credits will appear here', 
                              style: TextStyle(fontSize: 11, color: Colors.grey), textAlign: TextAlign.center),
                          ],
                        ),
                      ),
                    )
                  else
                    ..._entries.map((e) {
                      final isIn = (e['balanceAfter'] ?? 0) > (e['balanceBefore'] ?? 0);
                      final desc = e['description'] ?? '';
                      final typeMatch = RegExp(r'INT-(\w+)').firstMatch(desc);
                      final type = typeMatch != null ? typeMatch.group(1)!.replaceAll('_', ' ') : 'Transaction';
                      
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: isIn ? Colors.green.shade50 : Colors.red.shade50,
                            child: Icon(
                              isIn ? Icons.arrow_downward : Icons.arrow_upward,
                              color: isIn ? Colors.green : Colors.red,
                              size: 20,
                            ),
                          ),
                          title: Text(type, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(desc, style: const TextStyle(fontSize: 11), maxLines: 2, overflow: TextOverflow.ellipsis),
                              Text('${e['group']?['name'] ?? ''} · ${DateTime.parse(e['createdAt'] ?? DateTime.now().toIso8601String()).toString().substring(0, 10)}',
                                style: const TextStyle(fontSize: 10, color: Colors.grey)),
                            ],
                          ),
                          trailing: Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('UGX ${(e['amount'] ?? 0).toString()}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                decoration: BoxDecoration(
                                  color: isIn ? Colors.green.shade100 : Colors.red.shade100,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(isIn ? 'IN' : 'OUT', style: TextStyle(fontSize: 9, color: isIn ? Colors.green.shade800 : Colors.red.shade800)),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
