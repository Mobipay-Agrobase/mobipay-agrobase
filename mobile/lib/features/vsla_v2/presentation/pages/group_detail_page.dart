/**
 * VSLA V2 — Group Detail Page (Mobile)
 * Shows full group info: stats, config, key holders, cycle, recent transactions
 */
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../data/services/vsla_v2_api.dart';
import 'group_settings_page.dart';

class GroupDetailPage extends StatefulWidget {
  final String groupId;
  final String groupName;

  const GroupDetailPage({super.key, required this.groupId, required this.groupName});

  @override
  State<GroupDetailPage> createState() => _GroupDetailPageState();
}

class _GroupDetailPageState extends State<GroupDetailPage> {
  Map<String, dynamic>? _group;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await http.get(
        Uri.parse('${VslaV2Api.baseUrl}/api/vsla-v2/groups/${widget.groupId}'),
        headers: VslaV2Api._headers,
      );
      if (res.statusCode == 200) {
        setState(() {
          _group = jsonDecode(res.body)['group'];
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
        title: Text(widget.groupName),
        backgroundColor: const Color(0xFF059669),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(
                builder: (_) => GroupSettingsPage(groupId: widget.groupId, groupName: widget.groupName),
              )).then((saved) {
                if (saved == true) _load();
              });
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _group == null
              ? const Center(child: Text('Failed to load'))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Stats Row
                    Row(
                      children: [
                        _statCard('Members', '${_group!['_count']?['members'] ?? 0}', Icons.people, Colors.blue),
                        const SizedBox(width: 8),
                        _statCard('Key Holders', '${_group!['_count']?['keyHolders'] ?? 0}', Icons.shield, Colors.purple),
                        const SizedBox(width: 8),
                        _statCard('Loans', '${_group!['_count']?['loans'] ?? 0}', Icons.account_balance, Colors.amber),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Card(
                      child: ListTile(
                        leading: const Icon(Icons.savings, color: Colors.emerald),
                        title: const Text('Cashbox Balance', style: TextStyle(fontSize: 12)),
                        subtitle: Text('UGX ${_group!['cashboxBalance']?.toString() ?? '0'}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      ),
                    ),

                    // Configuration
                    const SizedBox(height: 16),
                    const Text('Configuration', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          children: [
                            _configRow('Share Price', 'UGX ${_group!['sharePrice']}'),
                            _configRow('Loan Multiplier', '${_group!['loanMultiplier']}×'),
                            _configRow('Welfare', 'UGX ${_group!['welfareContribution']}'),
                            _configRow('Late Fine', 'UGX ${_group!['lateAttendanceFine']}'),
                            _configRow('Absence Fine', 'UGX ${_group!['absenceFine']}'),
                            _configRow('Cycle Length', '${_group!['cycleLengthDays']} days'),
                            _configRow('Key Holders', '${_group!['minKeyHolders']} - ${_group!['maxKeyHolders']}'),
                          ],
                        ),
                      ),
                    ),

                    // Key Holders
                    if (_group!['keyHolders'] != null && (_group!['keyHolders'] as List).isNotEmpty) ...[
                      const SizedBox(height: 16),
                      const Text('Key Holders', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      ...(_group!['keyHolders'] as List).map((kh) => Card(
                        child: ListTile(
                          leading: const Icon(Icons.shield, color: Colors.purple),
                          title: Text(kh['fullName'], style: const TextStyle(fontSize: 14)),
                          subtitle: Text(kh['phone'], style: const TextStyle(fontSize: 12)),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(color: Colors.purple.shade100, borderRadius: BorderRadius.circular(8)),
                            child: Text(kh['role'], style: TextStyle(fontSize: 10, color: Colors.purple.shade800, fontWeight: FontWeight.w600)),
                          ),
                        ),
                      )),
                    ],

                    // Active Cycle
                    if (_group!['activeCycle'] != null) ...[
                      const SizedBox(height: 16),
                      const Text('Active Cycle', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            children: [
                              _configRow('Name', _group!['activeCycle']['name']),
                              _configRow('Status', _group!['activeCycle']['status']),
                              _configRow('Start', _formatDate(_group!['activeCycle']['startDate'])),
                              _configRow('End', _formatDate(_group!['activeCycle']['endDate'])),
                              _configRow('Freeze Date', _formatDate(_group!['activeCycle']['freezeDate'])),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(height: 4),
              Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _configRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: Colors.grey)),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '—';
    final date = DateTime.tryParse(dateStr);
    if (date == null) return '—';
    return '${date.day}/${date.month}/${date.year}';
  }
}
