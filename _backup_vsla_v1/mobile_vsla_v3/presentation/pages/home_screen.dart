import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../core/config.dart';
import 'vsla_groups_screen.dart';
import 'vsla_loans_screen.dart';
import 'vsla_savings_screen.dart';
import 'vsla_meetings_screen.dart';
import 'vsla_social_fund_screen.dart';
import 'nssf_screen.dart';
import 'dashboard_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final user = ApiService().user;
    final screens = [
      const DashboardScreen(),
      const VslaGroupsScreen(),
      const VslaLoansScreen(),
      const VslaSavingsScreen(),
      const VslaMeetingsScreen(),
      const VslaSocialFundScreen(),
      const NssfScreen(),
    ];
    final items = [
      const BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Home'),
      const BottomNavigationBarItem(icon: Icon(Icons.groups_outlined), activeIcon: Icon(Icons.groups), label: 'Groups'),
      const BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_outlined), activeIcon: Icon(Icons.account_balance_wallet), label: 'Loans'),
      const BottomNavigationBarItem(icon: Icon(Icons.savings_outlined), activeIcon: Icon(Icons.savings), label: 'Savings'),
      const BottomNavigationBarItem(icon: Icon(Icons.event_outlined), activeIcon: Icon(Icons.event), label: 'Meetings'),
      const BottomNavigationBarItem(icon: Icon(Icons.volunteer_activism_outlined), activeIcon: Icon(Icons.volunteer_activism), label: 'Welfare'),
      const BottomNavigationBarItem(icon: Icon(Icons.landmark_outlined), activeIcon: Icon(Icons.landmark), label: 'NSSF'),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('MobiPay Agrobase'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (v) async {
              if (v == 'logout') {
                await ApiService().logout();
                if (!mounted) return;
                Navigator.of(context).pushReplacementNamed('/');
              }
            },
            itemBuilder: (_) => [
              PopupMenuItem(
                value: 'profile',
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Colors.white,
                    child: Text((user?['name'] ?? 'U')[0], style: const TextStyle(color: Color(0xFF059669))),
                  ),
                  title: Text(user?['name'] ?? 'User', style: const TextStyle(fontSize: 14)),
                  subtitle: Text(user?['role'] ?? '', style: const TextStyle(fontSize: 12)),
                ),
              ),
              const PopupMenuItem(value: 'logout', child: Row(children: [Icon(Icons.logout, size: 18), SizedBox(width: 8), Text('Logout')])),
            ],
          ),
        ],
      ),
      body: screens[_index],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFF059669),
        unselectedItemColor: Colors.grey,
        items: items,
        showUnselectedLabels: true,
        selectedFontSize: 11,
        unselectedFontSize: 11,
      ),
    );
  }
}
