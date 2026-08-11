import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';

/// Farmer Bank Accounts Screen — Manage farmer's bank accounts
///
/// Shows: List of bank accounts with add/edit/delete functionality
/// Supports multiple accounts with primary flag

final bankAccountsProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, farmerId) async {
  final res = await ApiClient().get('/api/farmers/$farmerId/bank-accounts');
  if (res.statusCode != 200) {
    throw Exception('Failed to load bank accounts (${res.statusCode})');
  }
  final data = jsonDecode(res.body);
  return (data['accounts'] as List<dynamic>? ?? [])
      .map((e) => (e as Map<String, dynamic>))
      .toList();
});

class FarmerBankAccountsPage extends ConsumerStatefulWidget {
  final String farmerId;
  final String farmerName;

  const FarmerBankAccountsPage({
    super.key,
    required this.farmerId,
    required this.farmerName,
  });

  @override
  ConsumerState<FarmerBankAccountsPage> createState() => _FarmerBankAccountsPageState();
}

class _FarmerBankAccountsPageState extends ConsumerState<FarmerBankAccountsPage> {
  @override
  Widget build(BuildContext context) {
    final accountsAsync = ref.watch(bankAccountsProvider(widget.farmerId));

    return Scaffold(
      appBar: AppBar(
        title: Text('Bank Accounts - ${widget.farmerName}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showAddEditDialog(context),
          ),
        ],
      ),
      body: accountsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
        data: (accounts) {
          if (accounts.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.account_balance, size: 64, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text('No bank accounts', style: TextStyle(fontSize: 18, color: Colors.grey.shade600)),
                  const SizedBox(height: 8),
                  Text('Tap + to add a bank account', style: TextStyle(color: Colors.grey.shade500)),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: accounts.length,
            itemBuilder: (context, index) {
              final account = accounts[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: account['isPrimary'] == true
                        ? Colors.green.shade100
                        : Colors.blue.shade100,
                    child: Icon(
                      Icons.account_balance,
                      color: account['isPrimary'] == true ? Colors.green : Colors.blue,
                    ),
                  ),
                  title: Text(account['bankName'] ?? 'Unknown Bank'),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Account: ${account['accountNo'] ?? 'N/A'}'),
                      if (account['accountType'] != null)
                        Text('Type: ${account['accountType']}'),
                      if (account['branchDetails'] != null)
                        Text('Branch: ${account['branchDetails']}'),
                    ],
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (account['isPrimary'] == true)
                        const Badge(label: Text('Primary')),
                      IconButton(
                        icon: const Icon(Icons.edit, size: 20),
                        onPressed: () => _showAddEditDialog(context, account: account),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, size: 20, color: Colors.red),
                        onPressed: () => _confirmDelete(context, account),
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

  void _showAddEditDialog(BuildContext context, {Map<String, dynamic>? account}) {
    final isEditing = account != null;
    final accountTypeController = TextEditingController(text: account?['accountType'] ?? '');
    final accountNoController = TextEditingController(text: account?['accountNo'] ?? '');
    final bankNameController = TextEditingController(text: account?['bankName'] ?? '');
    final branchController = TextEditingController(text: account?['branchDetails'] ?? '');
    final sortCodeController = TextEditingController(text: account?['sortCode'] ?? '');
    bool isPrimary = account?['isPrimary'] ?? false;

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
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isEditing ? 'Edit Bank Account' : 'Add Bank Account',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: accountTypeController.text.isEmpty ? null : accountTypeController.text,
                decoration: const InputDecoration(labelText: 'Account Type'),
                items: ['Current', 'Savings', 'Salary', 'Fixed Deposit', 'Recurring Deposit']
                    .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                    .toList(),
                onChanged: (v) => accountTypeController.text = v ?? '',
              ),
              const SizedBox(height: 12),
              TextField(
                controller: accountNoController,
                decoration: const InputDecoration(labelText: 'Account Number *'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: bankNameController,
                decoration: const InputDecoration(labelText: 'Bank Name *'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: branchController,
                decoration: const InputDecoration(labelText: 'Branch Details'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: sortCodeController,
                decoration: const InputDecoration(labelText: 'Sort Code'),
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                title: const Text('Primary Account'),
                value: isPrimary,
                onChanged: (v) => setModalState(() => isPrimary = v),
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
                      if (accountNoController.text.isEmpty || bankNameController.text.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Account number and bank name are required')),
                        );
                        return;
                      }

                      final data = {
                        'accountType': accountTypeController.text,
                        'accountNo': accountNoController.text,
                        'bankName': bankNameController.text,
                        'branchDetails': branchController.text,
                        'sortCode': sortCodeController.text,
                        'isPrimary': isPrimary,
                    };

                    try {
                      if (isEditing) {
                        data['accountId'] = account['id'];
                        await ApiClient().put('/api/farmers/${widget.farmerId}/bank-accounts', body: data);
                      } else {
                        await ApiClient().post('/api/farmers/${widget.farmerId}/bank-accounts', body: data);
                      }
                      if (context.mounted) Navigator.pop(context);
                      ref.invalidate(bankAccountsProvider(widget.farmerId));
                    } catch (_) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Failed to save bank account'), backgroundColor: Colors.red),
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
    );
  }

  void _confirmDelete(BuildContext context, Map<String, dynamic> account) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Bank Account'),
        content: Text('Delete ${account['bankName']} account ${account['accountNo']}?'),
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
                  '/api/farmers/${widget.farmerId}/bank-accounts?accountId=${account['id']}',
                );
              } catch (_) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Failed to delete bank account'), backgroundColor: Colors.red),
                  );
                }
              }
              if (context.mounted) Navigator.pop(context);
              ref.invalidate(bankAccountsProvider(widget.farmerId));
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
