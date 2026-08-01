/**
 * VSLA V2 — Member Dashboard
 * Shows member's savings, loans, shares, and actions
 */
import 'package:flutter/material.dart';

class MemberDashboardPage extends StatelessWidget {
  const MemberDashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My VSLA'),
        backgroundColor: const Color(0xFF059669),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => Navigator.pushReplacementNamed(context, '/'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // KPI Cards
          Row(
            children: [
              Expanded(child: _kpiCard('Total Savings', 'UGX ••••••', Icons.savings, Colors.green)),
              const SizedBox(width: 12),
              Expanded(child: _kpiCard('Shares', '12', Icons.pie_chart, Colors.blue)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _kpiCard('Outstanding Loan', 'UGX ••••••', Icons.account_balance_wallet, Colors.amber)),
              const SizedBox(width: 12),
              Expanded(child: _kpiCard('Welfare Balance', 'UGX ••••••', Icons.volunteer_activism, Colors.purple)),
            ],
          ),
          const SizedBox(height: 24),

          // Actions
          const Text('Actions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          _actionCard(context, 'Check Loan Eligibility', 'See if you qualify for a loan', Icons.check_circle, Colors.green, () {}),
          _actionCard(context, 'Apply for Loan', 'Submit a loan application', Icons.account_balance, Colors.amber, () {}),
          _actionCard(context, 'View My Loans', 'See loan history and status', Icons.receipt_long, Colors.blue, () {}),
          _actionCard(context, 'Meeting Attendance', 'View upcoming meetings', Icons.event, Colors.purple, () {}),
          _actionCard(context, 'My Statement', 'View transaction history', Icons.description, Colors.teal, () {}),
          _actionCard(context, 'E-Teller Mode', 'Record transactions at meetings', Icons.point_of_sale, Colors.indigo, () {}),
          _actionCard(context, 'Update KYC', 'Capture photo and ID', Icons.badge, Colors.red, () {}),

          const SizedBox(height: 24),
          // SRS Info
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('VSLA V2 — SRS Compliant', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 8),
                _featureRow('Key holder unanimous approval'),
                _featureRow('SMS OTP login'),
                _featureRow('Auto-eligibility check'),
                _featureRow('E-Teller at meetings'),
                _featureRow('Cycle freeze + share-out'),
                _featureRow('Cashbox tracking'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _kpiCard(String label, String value, IconData icon, MaterialColor color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _actionCard(BuildContext context, String title, String subtitle, IconData icon, MaterialColor color, VoidCallback onTap) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(backgroundColor: color.shade50, child: Icon(icon, color: color)),
        title: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
        trailing: const Icon(Icons.chevron_right, color: Colors.grey),
        onTap: onTap,
      ),
    );
  }

  Widget _featureRow(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(children: [
        const Icon(Icons.check, size: 14, color: Colors.green),
        const SizedBox(width: 6),
        Text(text, style: const TextStyle(fontSize: 12)),
      ]),
    );
  }
}
