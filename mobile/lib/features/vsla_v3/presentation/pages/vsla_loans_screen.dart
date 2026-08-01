import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../core/config.dart';
import '../models/vsla_models.dart';

class VslaLoansScreen extends StatefulWidget {
  const VslaLoansScreen({super.key});

  @override
  State<VslaLoansScreen> createState() => _VslaLoansScreenState();
}

class _VslaLoansScreenState extends State<VslaLoansScreen> {
  List<VslaLoan> _loans = [];
  bool _loading = true;
  String? _filter;
  final _filters = ['ALL', 'PENDING', 'APPROVED', 'DISBURSED', 'OVERDUE', 'REPAID'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final path = _filter == null || _filter == 'ALL' ? '/api/vsla/loans' : '/api/vsla/loans?status=$_filter';
      final res = await ApiService().get(path) as Map<String, dynamic>;
      _loans = (res['loans'] as List).map((j) => VslaLoan.fromJson(j as Map<String, dynamic>)).toList();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 44,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            children: _filters.map((f) {
              final active = (_filter ?? 'ALL') == f;
              return Padding(
                padding: const EdgeInsets.only(right: 6),
                child: FilterChip(
                  label: Text(f),
                  selected: active,
                  onSelected: (_) {
                    setState(() => _filter = f);
                    _load();
                  },
                  selectedColor: const Color(0xFF059669),
                  labelStyle: TextStyle(color: active ? Colors.white : Colors.grey.shade700, fontSize: 11),
                ),
              );
            }).toList(),
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _loans.length,
                    itemBuilder: (_, i) {
                      final l = _loans[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(child: Text(l.memberName, style: const TextStyle(fontWeight: FontWeight.w600))),
                                  _badge(l.status),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(l.purpose, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(child: _cell('Amount', formatUGX(l.amount))),
                                  Expanded(child: _cell('Repayable', formatUGX(l.totalRepayable))),
                                  Expanded(child: _cell('Outstanding', formatUGX(l.outstanding), color: Colors.amber.shade800)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _cell(String label, String value, {Color? color}) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
          Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
        ],
      );

  Widget _badge(String status) {
    final color = ['REPAID', 'COMPLETED'].contains(status)
        ? Colors.green
        : ['PENDING', 'SCHEDULED'].contains(status)
            ? Colors.amber
            : ['OVERDUE', 'DEFAULTED', 'REJECTED'].contains(status)
                ? Colors.red
                : Colors.blue;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
      child: Text(status, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
    );
  }
}
