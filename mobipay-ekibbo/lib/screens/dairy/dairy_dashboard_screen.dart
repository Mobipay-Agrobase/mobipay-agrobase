import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/my_app_bar.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/data/dairy_api.dart';
import 'package:mobipay_ekibbo/data/dairy_modules.dart';
import 'package:mobipay_ekibbo/data/dairy_repository.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';

/// ZIWA360 Dairy — main dashboard.
///
/// Only shown if the logged-in user's tenant is ZIWA360
/// (`ApiClient().tenantId == DairyModules.ziwa360TenantId`). Defence-in-depth:
/// if a non-ZIWA360 user lands here via deep link, they see a "not available"
/// state instead of any dairy UI.
///
/// Layout:
///   - Header card (gradient) with offline indicator + pending count.
///   - 6 KPI tiles in a 2-column grid: Total Cows, Total Staff, Today's Milk
///     Yield (litres), Pending Tasks, Vaccinations Due (≤30 days), Active
///     Withdrawal Locks.
///   - 29 module tiles in a 3-column grid — tap to open the per-module list.
///   - Pull-to-refresh forces a fresh API sync.
class DairyDashboardScreen extends StatefulWidget {
  const DairyDashboardScreen({super.key});

  @override
  State<DairyDashboardScreen> createState() => _DairyDashboardScreenState();
}

class _DairyDashboardScreenState extends State<DairyDashboardScreen> {
  final DairyApi _api = DairyApi();

  Map<String, int> _kpis = const {};
  bool _loading = true;
  bool _offline = false;
  int _pendingCount = 0;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initAndLoad();
  }

  Future<void> _initAndLoad() async {
    // Make sure the cache + connectivity listener are initialised.
    await DairyRepository().init();
    await _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final online = await DairyRepository().isOnline();
      final kpis = await _api.fetchDashboardKpis();
      final pending = await DairyRepository().pendingCount();
      if (!mounted) return;
      setState(() {
        _kpis = kpis;
        _offline = !online;
        _pendingCount = pending;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to load dashboard: $e';
        _loading = false;
      });
    }
  }

  Future<void> _onSyncPressed() async {
    final n = await DairyRepository().syncPending();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          n > 0
              ? 'Synced $n pending ${n == 1 ? 'record' : 'records'}'
              : 'Nothing to sync',
        ),
        backgroundColor:
            n > 0 ? ColorConstant.success : ColorConstant.info,
      ),
    );
    await _load();
  }

  void _openModule(DairyModule module) {
    Navigator.of(context).pushNamed(
      RouterName.dairyList,
      arguments: module,
    );
  }

  @override
  Widget build(BuildContext context) {
    // Defence-in-depth: if a non-ZIWA360 user lands here, show "not available".
    if (ApiClient().tenantId != DairyModules.ziwa360TenantId) {
      return Scaffold(
        backgroundColor: ColorConstant.background,
        appBar: MyAppBar(title: 'Dairy (ZIWA360)'),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.lock_outline,
                    size: 48, color: ColorConstant.textSecondary),
                const SizedBox(height: 12),
                Text(
                  'Dairy module is only available on the ZIWA360 tenant.',
                  textAlign: TextAlign.center,
                  style: TextStyleConstant.robotoW400(
                    fontSize: 14,
                    color: ColorConstant.text79,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(
        title: 'Dairy (ZIWA360)',
        actions: [
          if (_pendingCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 4),
              child: Center(
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: ColorConstant.warning,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '$_pendingCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.sync, color: Colors.white),
            tooltip: 'Sync now',
            onPressed: _onSyncPressed,
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            tooltip: 'Refresh',
            onPressed: _load,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorState()
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _buildHeaderCard(),
                      const SizedBox(height: 16),
                      _buildKpiGrid(),
                      const SizedBox(height: 24),
                      _buildModulesSection(),
                    ],
                  ),
                ),
    );
  }

  Widget _buildHeaderCard() {
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
          Row(
            children: [
              const Icon(Icons.water_drop, color: Colors.white, size: 32),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'ZIWA360 Dairy Farm',
                  style: TextStyleConstant.quicksandW700(
                    fontSize: 20,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '29 modules · offline-first · tenant-isolated',
            style: TextStyleConstant.robotoW400(
              fontSize: 13,
              color: Colors.white.withOpacity(0.85),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _offline
                      ? ColorConstant.warning.withOpacity(0.9)
                      : ColorConstant.success.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _offline ? Icons.cloud_off : Icons.cloud_done_outlined,
                      size: 12,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _offline ? 'OFFLINE' : 'ONLINE',
                      style: TextStyleConstant.robotoW500(
                        fontSize: 10,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
              if (_pendingCount > 0) ...[
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.18),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '$_pendingCount pending',
                    style: TextStyleConstant.robotoW500(
                      fontSize: 10,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildKpiGrid() {
    final tiles = <Map<String, dynamic>>[
      {
        'label': 'Total Cows',
        'value': _kpis['totalCows'] ?? 0,
        'icon': Icons.pets,
        'color': ColorConstant.primary,
      },
      {
        'label': 'Total Staff',
        'value': _kpis['totalStaff'] ?? 0,
        'icon': Icons.people_outline,
        'color': ColorConstant.gold,
      },
      {
        'label': "Today's Milk (L)",
        'value': _kpis['todayMilkLitres'] ?? 0,
        'icon': Icons.water_drop_outlined,
        'color': ColorConstant.secondary,
      },
      {
        'label': 'Pending Tasks',
        'value': _kpis['pendingTasks'] ?? 0,
        'icon': Icons.task_alt,
        'color': ColorConstant.info,
      },
      {
        'label': 'Vaccinations Due',
        'value': _kpis['vaccinationsDue'] ?? 0,
        'icon': Icons.vaccines_outlined,
        'color': ColorConstant.danger,
      },
      {
        'label': 'Active Withdrawals',
        'value': _kpis['activeWithdrawals'] ?? 0,
        'icon': Icons.lock_clock_outlined,
        'color': ColorConstant.warning,
      },
    ];
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.5,
      ),
      itemCount: tiles.length,
      itemBuilder: (_, i) {
        final t = tiles[i];
        final color = t['color'] as Color;
        final icon = t['icon'] as IconData;
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
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${t['value']}',
                    style: TextStyleConstant.quicksandW700(
                      fontSize: 24,
                      color: ColorConstant.heading,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    t['label'] as String,
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

  Widget _buildModulesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Modules',
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
            crossAxisCount: 3,
            crossAxisSpacing: 10,
            mainAxisSpacing: 14,
            childAspectRatio: 0.92,
          ),
          itemCount: DairyModules.all.length,
          itemBuilder: (_, i) {
            final m = DairyModules.all[i];
            return _buildModuleTile(m);
          },
        ),
      ],
    );
  }

  Widget _buildModuleTile(DairyModule module) {
    return InkWell(
      onTap: () => _openModule(module),
      borderRadius: BorderRadius.circular(12),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: module.color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(module.icon, color: module.color, size: 24),
          ),
          const SizedBox(height: 6),
          Text(
            module.title,
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
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline,
                size: 48, color: ColorConstant.danger),
            const SizedBox(height: 12),
            Text(
              _error ?? 'Unknown error',
              textAlign: TextAlign.center,
              style: TextStyleConstant.robotoW400(
                fontSize: 13,
                color: ColorConstant.text79,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _load,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
