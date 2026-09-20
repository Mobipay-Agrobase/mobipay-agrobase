import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';

/// EKiBBO Dashboard — fetching real KPIs from /api/dashboard/stats
/// (farmer count, training count, group count, etc.) + tile navigation
/// to Farmers / Trainings / Reports modules.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _stats;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ApiClient().get('/api/dashboard/stats');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (!mounted) return;
        setState(() {
          _stats = data['stats'] ?? data;
          _loading = false;
        });
      } else if (res.statusCode == 401) {
        // Session expired — back to login
        if (!mounted) return;
        await ApiClient().clearSession();
        navigatorKey.currentState?.pushReplacementNamed(RouterName.login);
      } else {
        if (!mounted) return;
        setState(() {
          _error = 'Failed to load dashboard (HTTP ${res.statusCode})';
          _loading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Network error: $e';
        _loading = false;
      });
    }
  }

  Future<void> _logout() async {
    await ApiClient().clearSession();
    ApiClient().clearAuth();
    if (!mounted) return;
    navigatorKey.currentState?.pushReplacementNamed(RouterName.login);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: AppBar(
        title: Text(AppLang.local.dashboard),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadStats,
            tooltip: 'Refresh',
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: _logout,
            tooltip: AppLang.local.sign_out,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorState()
              : RefreshIndicator(
                  onRefresh: _loadStats,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _buildWelcomeCard(),
                      const SizedBox(height: 16),
                      _buildStatsGrid(),
                      const SizedBox(height: 16),
                      _buildQuickActions(),
                    ],
                  ),
                ),
    );
  }

  Widget _buildWelcomeCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [ColorConstant.primary, ColorConstant.primaryDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.coffee, color: Colors.white, size: 32),
          const SizedBox(height: 8),
          Text(
            'Welcome to EKiBBO',
            style: TextStyleConstant.quicksandW700(
              fontSize: 20,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Coffee exporter field operations',
            style: TextStyleConstant.robotoW400(
              fontSize: 13,
              color: Colors.white.withOpacity(0.85),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid() {
    final stats = _stats ?? {};
    final cards = <Map<String, dynamic>>[
      {
        'label': AppLang.local.total_farmers,
        'value': stats['farmerCount'] ?? 0,
        'icon': Icons.people_outline,
        'color': ColorConstant.secondary,
      },
      {
        'label': AppLang.local.trainings,
        'value': stats['trainingCount'] ?? 0,
        'icon': Icons.school_outlined,
        'color': ColorConstant.gold,
      },
      {
        'label': 'Groups',
        'value': stats['groupCount'] ?? 0,
        'icon': Icons.group_work_outlined,
        'color': ColorConstant.info,
      },
      {
        'label': 'Loans',
        'value': stats['loanCount'] ?? 0,
        'icon': Icons.account_balance_wallet_outlined,
        'color': ColorConstant.roleFarmer,
      },
    ];
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.4,
      ),
      itemCount: cards.length,
      itemBuilder: (_, i) {
        final c = cards[i];
        final color = c['color'] as Color;
        final icon = c['icon'] as IconData;
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: ColorConstant.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: ColorConstant.grayEB),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(icon, color: color, size: 18),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${c['value']}',
                    style: TextStyleConstant.quicksandW700(
                      fontSize: 24,
                      color: ColorConstant.heading,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    c['label'] as String,
                    style: TextStyleConstant.robotoW400(
                      fontSize: 11,
                      color: ColorConstant.text79,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildQuickActions() {
    final actions = <Map<String, dynamic>>[
      {
        'label': AppLang.local.farmers,
        'icon': Icons.people_outline,
        'color': ColorConstant.secondary,
        'route': RouterName.farmersList,
      },
      {
        'label': AppLang.local.add_farmer,
        'icon': Icons.person_add_outlined,
        'color': ColorConstant.secondary,
        'route': RouterName.farmerRegistration,
      },
      {
        'label': 'Farm Lands',
        'icon': Icons.landscape_outlined,
        'color': ColorConstant.primaryLight,
        'route': RouterName.farmLandsList,
      },
      {
        'label': AppLang.local.trainings,
        'icon': Icons.school_outlined,
        'color': ColorConstant.gold,
        'route': RouterName.trainingsList,
      },
      {
        'label': AppLang.local.crops,
        'icon': Icons.grass_outlined,
        'color': ColorConstant.secondaryLight,
        'route': RouterName.cropsList,
      },
      {
        'label': 'Procurement',
        'icon': Icons.shopping_cart_outlined,
        'color': ColorConstant.gold,
        'route': RouterName.procurementList,
      },
      {
        'label': 'Transactions',
        'icon': Icons.receipt_long_outlined,
        'color': ColorConstant.info,
        'route': RouterName.transactionsList,
      },
      {
        'label': AppLang.local.breakdowns_dashboard,
        'icon': Icons.bar_chart,
        'color': ColorConstant.info,
        'route': RouterName.breakdownsDashboard,
      },
      {
        'label': AppLang.local.qr_scan,
        'icon': Icons.qr_code_scanner,
        'color': ColorConstant.gold,
        'route': RouterName.qrScan,
      },
      {
        'label': 'Vehicles',
        'icon': Icons.local_shipping_outlined,
        'color': ColorConstant.textSecondary,
        'route': RouterName.vehiclesList,
      },
      {
        'label': AppLang.local.profile,
        'icon': Icons.person_outline,
        'color': ColorConstant.primaryLight,
        'route': RouterName.profile,
      },
      {
        'label': AppLang.local.settings,
        'icon': Icons.settings_outlined,
        'color': ColorConstant.textSecondary,
        'route': RouterName.settings,
      },
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: TextStyleConstant.robotoW600(
            fontSize: 14,
            color: ColorConstant.heading,
          ),
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            crossAxisSpacing: 8,
            mainAxisSpacing: 12,
            childAspectRatio: 0.85,
          ),
          itemCount: actions.length,
          itemBuilder: (_, i) {
            final a = actions[i];
            final color = a['color'] as Color;
            final icon = a['icon'] as IconData;
            final route = a['route'] as String?;
            return InkWell(
              onTap: () {
                if (route != null) {
                  Navigator.of(context).pushNamed(route);
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('${a['label']} coming soon'),
                      backgroundColor: ColorConstant.info,
                    ),
                  );
                }
              },
              borderRadius: BorderRadius.circular(12),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: color, size: 22),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    a['label'] as String,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyleConstant.robotoW400(
                      fontSize: 10,
                      color: ColorConstant.text79,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: ColorConstant.danger),
            const SizedBox(height: 12),
            Text(
              _error ?? 'Unknown error',
              textAlign: TextAlign.center,
              style: TextStyleConstant.robotoW400(
                fontSize: 14,
                color: ColorConstant.text79,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadStats,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
