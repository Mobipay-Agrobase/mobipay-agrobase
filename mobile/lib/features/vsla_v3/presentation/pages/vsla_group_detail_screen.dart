import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../core/config.dart';
import '../models/vsla_models.dart';

class VslaGroupDetailScreen extends StatefulWidget {
  final VslaGroup group;
  const VslaGroupDetailScreen({super.key, required this.group});

  @override
  State<VslaGroupDetailScreen> createState() => _VslaGroupDetailScreenState();
}

class _VslaGroupDetailScreenState extends State<VslaGroupDetailScreen> {
  int _tab = 0;
  List<VslaMember> _members = [];
  List<VslaLoan> _loans = [];
  List<VslaSaving> _savings = [];
  List<VslaMeeting> _meetings = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadTab(0);
  }

  Future<void> _loadTab(int tab) async {
    setState(() {
      _tab = tab;
      _loading = true;
    });
    try {
      if (tab == 0) {
        final res = await ApiService().get('/api/vsla/members?groupId=${widget.group.id}') as Map<String, dynamic>;
        _members = (res['members'] as List).map((j) => VslaMember.fromJson(j as Map<String, dynamic>)).toList();
      } else if (tab == 1) {
        final res = await ApiService().get('/api/vsla/loans?groupId=${widget.group.id}') as Map<String, dynamic>;
        _loans = (res['loans'] as List).map((j) => VslaLoan.fromJson(j as Map<String, dynamic>)).toList();
      } else if (tab == 2) {
        final res = await ApiService().get('/api/vsla/savings?groupId=${widget.group.id}&limit=50') as Map<String, dynamic>;
        _savings = (res['savings'] as List).map((j) => VslaSaving.fromJson(j as Map<String, dynamic>)).toList();
      } else if (tab == 3) {
        final res = await ApiService().get('/api/vsla/meetings?groupId=${widget.group.id}') as Map<String, dynamic>;
        _meetings = (res['meetings'] as List).map((j) => VslaMeeting.fromJson(j as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      // ignore
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.group.name, style: const TextStyle(fontSize: 16)),
          bottom: TabBar(
            onTap: _loadTab,
            tabs: const [
              Tab(text: 'Members'),
              Tab(text: 'Loans'),
              Tab(text: 'Savings'),
              Tab(text: 'Meetings'),
            ],
          ),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : TabBarView(
                children: [
                  _membersTab(),
                  _loansTab(),
                  _savingsTab(),
                  _meetingsTab(),
                ],
              ),
        floatingActionButton: _tab == 1
            ? FloatingActionButton.extended(
                onPressed: () => _showNewLoanSheet(),
                icon: const Icon(Icons.add),
                label: const Text('New Loan'),
              )
            : _tab == 2
                ? FloatingActionButton.extended(
                    onPressed: () => _showNewSavingSheet(),
                    icon: const Icon(Icons.add),
                    label: const Text('New Saving'),
                  )
                : null,
      ),
    );
  }

  Widget _membersTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _members.length,
      itemBuilder: (_, i) {
        final m = _members[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.grey.shade200,
              child: Text(m.fullName[0]),
            ),
            title: Text(m.fullName, style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('${m.memberId} · ${m.phone ?? 'No phone'}'),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(formatUGX(m.totalSavings), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green)),
                Text('${m.totalShares} shares', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                if (m.officerRole != null)
                  Container(
                    margin: const EdgeInsets.only(top: 2),
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                    decoration: BoxDecoration(color: Colors.purple.shade100, borderRadius: BorderRadius.circular(8)),
                    child: Text(m.officerRole!, style: TextStyle(fontSize: 9, color: Colors.purple.shade800, fontWeight: FontWeight.w600)),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _loansTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _loans.length,
      itemBuilder: (_, i) {
        final l = _loans[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: InkWell(
            onTap: () => _showLoanDetailSheet(l),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(l.memberName, style: const TextStyle(fontWeight: FontWeight.w600)),
                      ),
                      _statusBadge(l.status),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(l.purpose, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(child: _amtCell('Amount', formatUGX(l.amount))),
                      Expanded(child: _amtCell('Repayable', formatUGX(l.totalRepayable))),
                      Expanded(child: _amtCell('Outstanding', formatUGX(l.outstanding), color: Colors.amber.shade800)),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _savingsTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _savings.length,
      itemBuilder: (_, i) {
        final s = _savings[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            title: Text(s.memberName, style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('${formatDate(s.createdAt)} · ${s.paymentMethod} · ${s.transactionRef}', style: const TextStyle(fontSize: 11)),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(formatUGX(s.amount), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
                Text('${s.sharesBought} shares', style: const TextStyle(fontSize: 10, color: Colors.grey)),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _meetingsTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _meetings.length,
      itemBuilder: (_, i) {
        final m = _meetings[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.blue.shade100,
              child: Text('#${m.meetingNumber}', style: TextStyle(fontSize: 11, color: Colors.blue.shade800, fontWeight: FontWeight.bold)),
            ),
            title: Text(m.title, style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('${formatDate(m.meetingDate)} · ${m.attendanceCount}/${m.totalMembers} attended', style: const TextStyle(fontSize: 12)),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _statusBadge(m.status),
                const SizedBox(height: 2),
                Text(formatUGX(m.totalSavings), style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showNewSavingSheet() {
    final amountCtrl = TextEditingController();
    final memberCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 20, right: 20, top: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Record Saving', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Member', border: OutlineInputBorder()),
              items: _members.map((m) => DropdownMenuItem(value: m.id, child: Text(m.fullName))).toList(),
              onChanged: (v) => memberCtrl.text = v ?? '',
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountCtrl,
              decoration: const InputDecoration(labelText: 'Amount (UGX)', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                if (memberCtrl.text.isEmpty || amountCtrl.text.isEmpty) return;
                try {
                  await ApiService().post('/api/vsla/savings', body: {
                    'groupId': widget.group.id,
                    'memberId': memberCtrl.text,
                    'amount': int.parse(amountCtrl.text),
                    'paymentMethod': 'CASH',
                    'recordedByName': ApiService().user?['name'],
                  });
                  if (!mounted) return;
                  Navigator.pop(ctx);
                  _loadTab(2);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saving recorded ✓')));
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
                }
              },
              child: const Text('Save'),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _showNewLoanSheet() {
    final amountCtrl = TextEditingController();
    final purposeCtrl = TextEditingController();
    final memberCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 20, right: 20, top: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('New Loan Application', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Member', border: OutlineInputBorder()),
              items: _members.map((m) => DropdownMenuItem(value: m.id, child: Text(m.fullName))).toList(),
              onChanged: (v) => memberCtrl.text = v ?? '',
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountCtrl,
              decoration: const InputDecoration(labelText: 'Amount (UGX)', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: purposeCtrl,
              decoration: const InputDecoration(labelText: 'Purpose', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                if (memberCtrl.text.isEmpty || amountCtrl.text.isEmpty || purposeCtrl.text.isEmpty) return;
                try {
                  await ApiService().post('/api/vsla/loans', body: {
                    'groupId': widget.group.id,
                    'memberId': memberCtrl.text,
                    'amount': int.parse(amountCtrl.text),
                    'purpose': purposeCtrl.text,
                    'appliedByName': ApiService().user?['name'],
                  });
                  if (!mounted) return;
                  Navigator.pop(ctx);
                  _loadTab(1);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Loan application submitted ✓')));
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
                }
              },
              child: const Text('Submit'),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _showLoanDetailSheet(VslaLoan loan) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(loan.memberName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(loan.purpose, style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 16),
            _detailRow('Amount', formatUGX(loan.amount)),
            _detailRow('Interest Rate', '${loan.transactionRef}'),
            _detailRow('Total Repayable', formatUGX(loan.totalRepayable)),
            _detailRow('Amount Repaid', formatUGX(loan.amountRepaid)),
            _detailRow('Outstanding', formatUGX(loan.outstanding)),
            _detailRow('Status', loan.status),
            _detailRow('Applied', formatDate(loan.applicationDate)),
            _detailRow('Due', formatDate(loan.expectedRepaymentDate)),
            const SizedBox(height: 16),
            if (loan.guarantors.isNotEmpty) ...[
              const Text('Guarantors', style: TextStyle(fontWeight: FontWeight.bold)),
              ...loan.guarantors.map((g) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Expanded(child: Text(g.memberName)),
                    Text(formatUGX(g.guaranteedAmount), style: const TextStyle(color: Colors.grey)),
                  ],
                ),
              )),
              const SizedBox(height: 16),
            ],
            if (loan.repayments.isNotEmpty) ...[
              const Text('Repayments', style: TextStyle(fontWeight: FontWeight.bold)),
              ...loan.repayments.map((r) => ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                title: Text(formatDate(r.createdAt)),
                trailing: Text(formatUGX(r.amount), style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.green)),
              )),
              const SizedBox(height: 16),
            ],
            // Action buttons based on status
            if (loan.status == 'PENDING') ...[
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => _actOnLoan(ctx, loan.id, 'approve'),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                      child: const Text('Approve'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => _actOnLoan(ctx, loan.id, 'reject'),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                      child: const Text('Reject'),
                    ),
                  ),
                ],
              ),
            ],
            if (loan.status == 'APPROVED')
              ElevatedButton(
                onPressed: () => _actOnLoan(ctx, loan.id, 'disburse'),
                child: const Text('Disburse Loan'),
              ),
            if (loan.status == 'DISBURSED' || loan.status == 'OVERDUE') ...[
              ElevatedButton(
                onPressed: () => _showRepaySheet(ctx, loan),
                child: const Text('Record Repayment'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _actOnLoan(BuildContext ctx, String loanId, String action) async {
    try {
      await ApiService().put('/api/vsla/loans/$loanId', body: {
        'action': action,
        'approvedByName': ApiService().user?['name'],
        if (action == 'disburse') 'disbursementMethod': 'CASH',
      });
      if (!mounted) return;
      Navigator.pop(ctx);
      _loadTab(1);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Loan $action ✓')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  void _showRepaySheet(BuildContext ctx, VslaLoan loan) {
    final amountCtrl = TextEditingController();
    Navigator.pop(ctx);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx2) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx2).viewInsets.bottom, left: 20, right: 20, top: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Record Repayment', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Outstanding: ${formatUGX(loan.outstanding)}', style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 12),
            TextField(
              controller: amountCtrl,
              decoration: const InputDecoration(labelText: 'Amount (UGX)', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                if (amountCtrl.text.isEmpty) return;
                try {
                  await ApiService().post('/api/vsla/loans/${loan.id}/repay', body: {
                    'amount': int.parse(amountCtrl.text),
                    'recordedByName': ApiService().user?['name'],
                  });
                  if (!mounted) return;
                  Navigator.pop(ctx2);
                  _loadTab(1);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Repayment recorded ✓')));
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
                }
              },
              child: const Text('Record'),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 110, child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13))),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }

  Widget _amtCell(String label, String value, {Color? color}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
        Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
      ],
    );
  }

  Widget _statusBadge(String status) {
    final color = ['ACTIVE', 'COMPLETED', 'REPAID', 'PAID', 'CONFIRMED', 'CONCLUDED'].contains(status)
        ? Colors.green
        : ['PENDING', 'SCHEDULED'].contains(status)
            ? Colors.amber
            : ['FAILED', 'REJECTED', 'OVERDUE', 'CANCELLED', 'DEFAULTED'].contains(status)
                ? Colors.red
                : Colors.blue;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(status, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
    );
  }
}
