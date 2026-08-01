import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../core/config.dart';
import '../models/vsla_models.dart';

class VslaMeetingsScreen extends StatefulWidget {
  const VslaMeetingsScreen({super.key});

  @override
  State<VslaMeetingsScreen> createState() => _VslaMeetingsScreenState();
}

class _VslaMeetingsScreenState extends State<VslaMeetingsScreen> {
  List<VslaMeeting> _meetings = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService().get('/api/vsla/meetings?limit=50') as Map<String, dynamic>;
      _meetings = (res['meetings'] as List).map((j) => VslaMeeting.fromJson(j as Map<String, dynamic>)).toList();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _meetings.length,
        itemBuilder: (_, i) {
          final m = _meetings[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: Colors.blue.shade100,
                        radius: 18,
                        child: Text('#${m.meetingNumber}', style: TextStyle(fontSize: 10, color: Colors.blue.shade800, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(m.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                            Text(formatDate(m.meetingDate), style: const TextStyle(fontSize: 12, color: Colors.grey)),
                          ],
                        ),
                      ),
                      _badge(m.status),
                    ],
                  ),
                  if (m.agenda != null) ...[
                    const SizedBox(height: 8),
                    Text(m.agenda!, style: const TextStyle(fontSize: 12, color: Colors.grey.shade700)),
                  ],
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.people, size: 14, color: Colors.grey.shade600),
                      const SizedBox(width: 4),
                      Text('${m.attendanceCount}/${m.totalMembers}', style: const TextStyle(fontSize: 11)),
                      const SizedBox(width: 16),
                      Icon(Icons.savings, size: 14, color: Colors.grey.shade600),
                      const SizedBox(width: 4),
                      Text(formatUGX(m.totalSavings), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.green)),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _badge(String status) {
    final color = status == 'CONCLUDED' ? Colors.green : status == 'CANCELLED' ? Colors.red : Colors.amber;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
      child: Text(status, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
    );
  }
}
