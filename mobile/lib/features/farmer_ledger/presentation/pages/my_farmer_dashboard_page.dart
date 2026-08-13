import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';

/// My Farmer Dashboard — self-service view for the logged-in farmer.
///
/// Calls GET /api/farmers/me and shows the farmer's own produce sold,
/// income earned, outstanding loans / inputs, and their transaction ledger.

final myFarmerDashboardProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final api = ApiClient();
  final res = await api.get('/api/farmers/me');
  if (res.statusCode != 200) {
    throw Exception(
      jsonDecode(res.body)['error'] ?? 'Failed to load your dashboard (${res.statusCode})',
    );
  }
  return jsonDecode(res.body) as Map<String, dynamic>;
});

class MyFarmerDashboardPage extends ConsumerWidget {
  const MyFarmerDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myFarmerDashboardProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Dashboard')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: Colors.grey),
                const SizedBox(height: 16),
                Text('$err', textAlign: TextAlign.center),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: () => ref.invalidate(myFarmerDashboardProvider),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
        data: (data) {
          final farmer = data['farmer'] ?? {};
          final summary = data['summary'] ?? {};
          final sales = (data['sales'] as List?) ?? [];
          final loans = (data['loans'] as List?) ?? [];
          final inputs = (data['inputs'] as List?) ?? [];
          final ledger = (data['ledger'] as List?) ?? [];

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myFarmerDashboardProvider),
            child: ListView(
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
                    subtitle: Text('${farmer['farmerCode'] ?? ''} · ${farmer['villageName'] ?? ''}'),
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
                      title: 'Products Sold',
                      value: '${summary['totalProductsSold'] ?? 0}',
                      color: Colors.green,
                      icon: Icons.sell,
                    ),
                    _SummaryCard(
                      title: 'Total Income',
                      value: 'UGX ${(summary['totalIncome'] ?? 0).toDouble().toStringAsFixed(0)}',
                      color: Colors.green.shade800,
                      icon: Icons.trending_up,
                    ),
                    _SummaryCard(
                      title: 'Total Paid',
                      value: 'UGX ${(summary['totalPaid'] ?? 0).toDouble().toStringAsFixed(0)}',
                      color: Colors.blue,
                      icon: Icons.payments,
                    ),
                    _SummaryCard(
                      title: 'Current Balance',
                      value: 'UGX ${(summary['currentBalance'] ?? 0).toDouble().toStringAsFixed(0)}',
                      color: Colors.purple,
                      icon: Icons.account_balance_wallet,
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Outstanding balances
                if (((summary['outstandingLoans'] ?? 0) as num) > 0 ||
                    ((summary['outstandingInputs'] ?? 0) as num) > 0) ...[
                  Row(
                    children: [
                      if (((summary['outstandingLoans'] ?? 0) as num) > 0)
                        Expanded(
                          child: Card(
                            color: Colors.amber.shade50,
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Outstanding Loans',
                                      style: TextStyle(fontSize: 11, color: Colors.grey)),
                                  Text(
                                    'UGX ${(summary['outstandingLoans'] ?? 0).toDouble().toStringAsFixed(0)}',
                                    style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.amber.shade800),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      if (((summary['outstandingLoans'] ?? 0) as num) > 0 &&
                          ((summary['outstandingInputs'] ?? 0) as num) > 0)
                        const SizedBox(width: 8),
                      if (((summary['outstandingInputs'] ?? 0) as num) > 0)
                        Expanded(
                          child: Card(
                            color: Colors.purple.shade50,
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Outstanding Inputs',
                                      style: TextStyle(fontSize: 11, color: Colors.grey)),
                                  Text(
                                    'UGX ${(summary['outstandingInputs'] ?? 0).toDouble().toStringAsFixed(0)}',
                                    style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.purple.shade800),
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

                // Produce sold
                if (sales.isNotEmpty) ...[
                  const Text('Produce Sold', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...sales.take(10).map((s) => _SaleTile(sale: s)),
                  const SizedBox(height: 16),
                ],

                // Loans
                if (loans.isNotEmpty) ...[
                  const Text('Loans', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...loans.map((l) => _LoanTile(loan: l)),
                  const SizedBox(height: 16),
                ],

                // Inputs
                if (inputs.isNotEmpty) ...[
                  const Text('Inputs', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...inputs.map((i) => _InputTile(input: i)),
                  const SizedBox(height: 16),
                ],

                // Ledger
                const Text('Transactions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                if (ledger.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(32),
                    child: Column(
                      children: [
                        Icon(Icons.receipt_long, size: 48, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('No transactions yet', style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  )
                else
                  ...ledger.map((e) => _LedgerTile(entry: e)),
              ],
            ),
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

class _SaleTile extends StatelessWidget {
  final Map<String, dynamic> sale;
  const _SaleTile({required this.sale});

  @override
  Widget build(BuildContext context) {
    final qty = (sale['quantity'] ?? 0).toDouble();
    final net = (sale['netAmount'] ?? sale['totalAmount'] ?? 0).toDouble();
    final date = sale['createdAt'] ?? '';
    return Card(
      child: ListTile(
        leading: const CircleAvatar(
          backgroundColor: Colors.cyan,
          child: Icon(Icons.sell, color: Colors.white, size: 18),
        ),
        title: Text(sale['product'] ?? 'Produce', style: const TextStyle(fontSize: 13)),
        subtitle: Text(
          '${sale['category'] ?? ''} · ${date.isNotEmpty ? DateTime.parse(date).toString().substring(0, 10) : ''}',
          style: const TextStyle(fontSize: 11),
        ),
        trailing: Text(
          '${qty.toStringAsFixed(0)} kg · UGX ${net.toStringAsFixed(0)}',
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green),
        ),
      ),
    );
  }
}

class _LoanTile extends StatelessWidget {
  final Map<String, dynamic> loan;
  const _LoanTile({required this.loan});

  @override
  Widget build(BuildContext context) {
    final amount = (loan['amount'] ?? 0).toDouble();
    final balance = (loan['balance'] ?? 0).toDouble();
    final status = loan['status'] ?? '';
    return Card(
      child: ListTile(
        leading: const CircleAvatar(
          backgroundColor: Colors.blue,
          child: Icon(Icons.savings, color: Colors.white, size: 18),
        ),
        title: Text(loan['productName'] ?? 'Farmer Loan', style: const TextStyle(fontSize: 13)),
        subtitle: Text(
          'UGX ${amount.toStringAsFixed(0)} · $status',
          style: const TextStyle(fontSize: 11),
        ),
        trailing: Text(
          'Bal UGX ${balance.toStringAsFixed(0)}',
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.amber.shade800),
        ),
      ),
    );
  }
}

class _InputTile extends StatelessWidget {
  final Map<String, dynamic> input;
  const _InputTile({required this.input});

  @override
  Widget build(BuildContext context) {
    final qty = (input['quantity'] ?? 0).toDouble();
    final balance = (input['balanceRemaining'] ?? 0).toDouble();
    return Card(
      child: ListTile(
        leading: const CircleAvatar(
          backgroundColor: Colors.purple,
          child: Icon(Icons.inventory, color: Colors.white, size: 18),
        ),
        title: Text(input['inputType'] ?? 'Input', style: const TextStyle(fontSize: 13)),
        subtitle: Text('${qty.toStringAsFixed(2)} · ${input['status'] ?? ''}',
            style: const TextStyle(fontSize: 11)),
        trailing: Text(
          'Bal UGX ${balance.toStringAsFixed(0)}',
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.purple.shade800),
        ),
      ),
    );
  }
}

class _LedgerTile extends StatelessWidget {
  final Map<String, dynamic> entry;
  const _LedgerTile({required this.entry});

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
                'Bal: UGX ${balance.toDouble().toStringAsFixed(0)}',
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
