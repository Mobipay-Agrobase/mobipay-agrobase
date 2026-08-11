import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';

/// Farmer Ledger Screen — View farmer's complete transaction history
///
/// Shows: Total Earned, Total Deducted, Total Paid, Current Balance
/// + Outstanding Loan and Input balances
/// + Full chronological transaction list with color-coded type badges

final ledgerProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, farmerId) async {
  final res = await ApiClient().get('/api/farmers/$farmerId/ledger');
  if (res.statusCode != 200) {
    throw Exception('Failed to load ledger (${res.statusCode})');
  }
  return jsonDecode(res.body) as Map<String, dynamic>;
});

class FarmerLedgerPage extends ConsumerWidget {
  final String farmerId;

  const FarmerLedgerPage({super.key, required this.farmerId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ledgerAsync = ref.watch(ledgerProvider(farmerId));

    return Scaffold(
      appBar: AppBar(title: const Text('Farmer Ledger')),
      body: ledgerAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
        data: (data) {
          final farmer = data['farmer'] ?? {};
          final entries = (data['entries'] as List?) ?? [];
          final summary = data['summary'] ?? {};

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Farmer header
              Card(
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Colors.green.shade100,
                    child: Text(
                      '${farmer['firstName']?[0] ?? '?'}${farmer['lastName']?[0] ?? ''}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  title: Text('${farmer['firstName'] ?? ''} ${farmer['lastName'] ?? ''}'),
                  subtitle: Text(farmer['farmerCode'] ?? ''),
                ),
              ),
              const SizedBox(height: 16),

              // Summary cards
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
                childAspectRatio: 1.8,
                children: [
                  _SummaryCard(
                    title: 'Total Earned',
                    value: 'UGX ${(summary['totalEarned'] ?? 0).toStringAsFixed(0)}',
                    color: Colors.green,
                    icon: Icons.trending_up,
                  ),
                  _SummaryCard(
                    title: 'Total Deducted',
                    value: 'UGX ${(summary['totalDeducted'] ?? 0).toStringAsFixed(0)}',
                    color: Colors.red,
                    icon: Icons.trending_down,
                  ),
                  _SummaryCard(
                    title: 'Total Paid',
                    value: 'UGX ${(summary['totalPaid'] ?? 0).toStringAsFixed(0)}',
                    color: Colors.blue,
                    icon: Icons.payments,
                  ),
                  _SummaryCard(
                    title: 'Current Balance',
                    value: 'UGX ${(summary['currentBalance'] ?? 0).toStringAsFixed(0)}',
                    color: Colors.purple,
                    icon: Icons.account_balance_wallet,
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Outstanding balances
              if ((summary['outstandingLoans'] ?? 0) > 0 || (summary['outstandingInputs'] ?? 0) > 0) ...[
                Row(
                  children: [
                    if ((summary['outstandingLoans'] ?? 0) > 0)
                      Expanded(
                        child: Card(
                          color: Colors.amber.shade50,
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Outstanding Loans', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                Text(
                                  'UGX ${(summary['outstandingLoans'] ?? 0).toStringAsFixed(0)}',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.amber.shade800),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    if ((summary['outstandingLoans'] ?? 0) > 0 && (summary['outstandingInputs'] ?? 0) > 0)
                      const SizedBox(width: 8),
                    if ((summary['outstandingInputs'] ?? 0) > 0)
                      Expanded(
                        child: Card(
                          color: Colors.purple.shade50,
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Outstanding Inputs', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                Text(
                                  'UGX ${(summary['outstandingInputs'] ?? 0).toStringAsFixed(0)}',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.purple.shade800),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
              ],

              // Transaction history
              const Text('Transaction History', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),

              if (entries.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: Column(
                      children: [
                        Icon(Icons.receipt_long, size: 48, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('No transactions yet', style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  ),
                )
              else
                ...entries.map((e) => _LedgerEntryTile(entry: e)),
            ],
          );
        },
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String title;
  final String value;
  final Color color;
  final IconData icon;

  const _SummaryCard({required this.title, required this.value, required this.color, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(icon, size: 16, color: color),
                const SizedBox(width: 4),
                Expanded(child: Text(title, style: const TextStyle(fontSize: 11, color: Colors.grey))),
              ],
            ),
            Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }
}

class _LedgerEntryTile extends StatelessWidget {
  final Map<String, dynamic> entry;

  const _LedgerEntryTile({required this.entry});

  @override
  Widget build(BuildContext context) {
    final type = entry['type'] ?? '';
    final amount = (entry['amount'] ?? 0).toDouble();
    final description = entry['description'] ?? '';
    final date = entry['date'] ?? '';
    final balance = entry['balanceAfter'];

    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _typeColor(type),
          child: Icon(_typeIcon(type), color: Colors.white, size: 18),
        ),
        title: Text(description, style: const TextStyle(fontSize: 13)),
        subtitle: Text(
          '${type.toString().replaceAll('_', ' ')} · ${date.isNotEmpty ? DateTime.parse(date).toString().substring(0, 10) : ''}',
          style: const TextStyle(fontSize: 11),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${amount >= 0 ? '+' : '-'}UGX ${amount.abs().toStringAsFixed(0)}',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: amount >= 0 ? Colors.green : Colors.red,
              ),
            ),
            if (balance != null)
              Text(
                'Bal: UGX ${balance.toStringAsFixed(0)}',
                style: const TextStyle(fontSize: 10, color: Colors.grey),
              ),
          ],
        ),
      ),
    );
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'PURCHASE':
        return Colors.green;
      case 'SALE':
        return Colors.cyan;
      case 'LOAN_DISBURSE':
        return Colors.blue;
      case 'LOAN_REPAY':
        return Colors.amber;
      case 'INPUT_DIST':
        return Colors.purple;
      case 'INPUT_REPAY':
        return Colors.pink;
      case 'TRAINING':
        return Colors.indigo;
      case 'INSURANCE':
        return Colors.teal;
      case 'CHARGE':
        return Colors.red;
      case 'PAYMENT':
        return Colors.green.shade700;
      default:
        return Colors.grey;
    }
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'PURCHASE':
        return Icons.shopping_cart;
      case 'SALE':
        return Icons.sell;
      case 'LOAN_DISBURSE':
      case 'LOAN_REPAY':
        return Icons.savings;
      case 'INPUT_DIST':
      case 'INPUT_REPAY':
        return Icons.inventory;
      case 'TRAINING':
        return Icons.school;
      case 'INSURANCE':
        return Icons.shield;
      case 'CHARGE':
        return Icons.money_off;
      case 'PAYMENT':
        return Icons.payments;
      default:
        return Icons.receipt;
    }
  }
}
