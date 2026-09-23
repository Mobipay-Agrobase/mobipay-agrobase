import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:mobipay_ekibbo/components/g_image.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/data/dairy_modules.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';

/// EKiBBO / ZIWA360 Dashboard — Farm Angel Upstream design.
///
/// Layout (top-to-bottom):
///   1. `SliverAppBar` (coffee brown, pinned) with:
///        - Leading  : hamburger (`ic_drawer.svg`) → opens MainShell drawer.
///        - Title     : tenant name ("Dashboard" / "ZIWA360").
///        - Actions   : sync icon (`ic_sync.svg`), bell (`ic_bell.svg`),
///                      profile avatar (initials circle).
///   2. KPI summary cards row — tenant-aware:
///        - EKiBBO  : Total Farmers, Trainings, Groups, Loans
///        - ZIWA360 : Total Cows, Staff, Milk Yield, Tasks
///      Each card is a shadow card (not a flat tile).
///   3. "Today Tasks" horizontal scrolling list — placeholder cards when no
///      tasks are available.
///   4. Footer spacing so the FAB doesn't cover content.
///
/// KPIs are fetched from `/api/dashboard/stats`. The dashboard is designed
/// to be hosted inside `MainShell` (which provides the drawer + FAB), so it
/// does NOT render its own `Scaffold` — it returns a `CustomScrollView`
/// directly. The `onOpenDrawer` callback is provided by `MainShell` so the
/// SliverAppBar's hamburger icon can open the host drawer.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({
    super.key,
    this.onOpenDrawer,
  });

  /// Opens the host drawer (provided by MainShell).
  final VoidCallback? onOpenDrawer;

  @override
  State<DashboardScreen> createState() => DashboardScreenState();
}

/// Public so `MainShell` can call `refreshStats()` via a GlobalKey.
class DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _stats;
  bool _loading = true;
  bool _refreshing = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  /// Public refresh hook (called by MainShell's drawer Sync item).
  Future<void> refreshStats() => _loadStats();

  Future<void> _loadStats() async {
    if (!mounted) return;
    setState(() {
      _loading = _stats == null;
      _refreshing = _stats != null;
      _error = null;
    });
    try {
      final res = await ApiClient().get('/api/dashboard/stats');
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        final Map<String, dynamic> data;
        if (decoded is Map<String, dynamic>) {
          final statsField = decoded['stats'];
          if (statsField is Map<String, dynamic>) {
            data = statsField;
          } else {
            data = decoded;
          }
        } else {
          data = <String, dynamic>{};
        }
        if (!mounted) return;
        setState(() {
          _stats = data;
          _loading = false;
          _refreshing = false;
        });
      } else if (res.statusCode == 401) {
        // Session expired — back to login.
        if (!mounted) return;
        await ApiClient().clearSession();
        navigatorKey.currentState?.pushReplacementNamed(RouterName.login);
      } else {
        if (!mounted) return;
        setState(() {
          _error = 'Failed to load dashboard (HTTP ${res.statusCode})';
          _loading = false;
          _refreshing = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Network error: $e';
        _loading = false;
        _refreshing = false;
      });
    }
  }

  bool get _isZiwa360 =>
      ApiClient().tenantId == DairyModules.ziwa360TenantId;

  String get _appBarTitle => _isZiwa360 ? 'ZIWA360' : AppLang.local.dashboard;

  String get _userInitials {
    return _isZiwa360 ? 'Z3' : 'FO';
  }

  // ─── KPI cards ───────────────────────────────────────────────────────────

  List<_KpiCard> _buildKpiCards() {
    final s = _stats ?? <String, dynamic>{};
    if (_isZiwa360) {
      return [
        _KpiCard(
          label: 'Total Cows',
          value: _readInt(s, ['cowCount', 'totalCows', 'cows']),
          icon: Icons.pets_outlined,
          color: ColorConstant.primary,
        ),
        _KpiCard(
          label: 'Staff',
          value: _readInt(s, ['staffCount', 'totalStaff']),
          icon: Icons.badge_outlined,
          color: ColorConstant.secondary,
        ),
        _KpiCard(
          label: 'Milk Yield (L)',
          value: _readInt(s, ['milkYield', 'todayMilkYield', 'milkToday']),
          icon: Icons.water_drop_outlined,
          color: ColorConstant.gold,
        ),
        _KpiCard(
          label: 'Tasks',
          value: _readInt(s, ['taskCount', 'tasks', 'pendingTasks']),
          icon: Icons.task_alt,
          color: ColorConstant.info,
        ),
      ];
    }
    return [
      _KpiCard(
        label: AppLang.local.total_farmers,
        value: _readInt(s, ['farmerCount', 'totalFarmers', 'farmers']),
        icon: Icons.people_outline,
        color: ColorConstant.secondary,
      ),
      _KpiCard(
        label: AppLang.local.trainings,
        value: _readInt(s, ['trainingCount', 'totalTrainings', 'trainings']),
        icon: Icons.school_outlined,
        color: ColorConstant.gold,
      ),
      _KpiCard(
        label: 'Groups',
        value: _readInt(s, ['groupCount', 'totalGroups', 'groups']),
        icon: Icons.group_work_outlined,
        color: ColorConstant.info,
      ),
      _KpiCard(
        label: 'Loans',
        value: _readInt(s, ['loanCount', 'totalLoans', 'loans']),
        icon: Icons.account_balance_wallet_outlined,
        color: ColorConstant.primaryLight,
      ),
    ];
  }

  int _readInt(Map<String, dynamic> m, List<String> keys) {
    for (final k in keys) {
      final v = m[k];
      if (v is int) return v;
      if (v is num) return v.toInt();
      if (v is String) {
        final parsed = int.tryParse(v);
        if (parsed != null) return parsed;
      }
    }
    return 0;
  }

  // ─── Today tasks (placeholder/demo data) ───────────────────────────────────

  /// Builds the list of "today" tasks. The backend doesn't expose a real
  /// tasks endpoint yet, so we synthesize a few from the stats payload (or
  /// fall back to friendly demo cards when no signal is available).
  List<_TaskCard> _buildTodayTasks() {
    final s = _stats ?? <String, dynamic>{};
    final tasks = <_TaskCard>[];
    final farmerCount = _readInt(s, ['farmerCount', 'totalFarmers']);
    final trainingCount = _readInt(s, ['trainingCount', 'totalTrainings']);
    if (_isZiwa360) {
      final milkYield = _readInt(s, ['milkYield', 'todayMilkYield']);
      if (milkYield > 0) {
        tasks.add(
          _TaskCard(
            title: 'Record today\'s milk yield',
            subtitle: '$milkYield L pending entry',
            color: ColorConstant.gold,
            icon: Icons.water_drop_outlined,
          ),
        );
      }
      tasks.add(
        _TaskCard(
          title: 'Vaccination check',
          subtitle: 'Cows due for vaccination',
          color: ColorConstant.primary,
          icon: Icons.vaccines_outlined,
        ),
      );
      tasks.add(
        _TaskCard(
          title: 'Staff attendance',
          subtitle: 'Mark today\'s roll call',
          color: ColorConstant.secondary,
          icon: Icons.badge_outlined,
        ),
      );
    } else {
      if (farmerCount > 0) {
        tasks.add(
          _TaskCard(
            title: 'Visit enrolled farmers',
            subtitle: '$farmerCount farmers in your region',
            color: ColorConstant.secondary,
            icon: Icons.people_outline,
          ),
        );
      }
      if (trainingCount > 0) {
        tasks.add(
          _TaskCard(
            title: 'Confirm training schedule',
            subtitle: '$trainingCount trainings logged',
            color: ColorConstant.gold,
            icon: Icons.school_outlined,
          ),
        );
      }
      tasks.add(
        _TaskCard(
          title: 'Procurement pickup',
          subtitle: 'Today\'s cherry collection round',
          color: ColorConstant.primary,
          icon: Icons.local_shipping_outlined,
        ),
      );
      tasks.add(
        _TaskCard(
          title: 'Farm land GPS pin',
          subtitle: 'Verify new plot boundaries',
          color: ColorConstant.info,
          icon: Icons.landscape_outlined,
        ),
      );
    }
    return tasks;
  }

  // ─── Build ────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Container(
      color: ColorConstant.background,
      child: Stack(
        children: [
          // Subtle dashboard_bg.png watermark behind the scrollable content.
          Positioned.fill(
            child: Opacity(
              opacity: 0.04,
              child: Image.asset(
                'dashboard_bg'.imgPNG,
                fit: BoxFit.cover,
                alignment: Alignment.topCenter,
              ),
            ),
          ),
          CustomScrollView(
            physics: const BouncingScrollPhysics(
              parent: AlwaysScrollableScrollPhysics(),
            ),
            slivers: [
              _buildSliverAppBar(),
              // Loading / error states occupy the remaining viewport.
              if (_loading)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: CircularProgressIndicator(
                      color: ColorConstant.primary,
                    ),
                  ),
                )
              else if (_error != null)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: _buildErrorState(),
                )
              else ...[
                _buildKpiSliver(),
                _buildTodayTasksSliver(),
                _buildActivitySliver(),
                const SliverPadding(padding: EdgeInsets.only(bottom: 96)),
              ],
            ],
          ),
        ],
      ),
    );
  }

  // ─── SliverAppBar ─────────────────────────────────────────────────────────

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      pinned: true,
      expandedHeight: 110,
      toolbarHeight: kToolbarHeight,
      backgroundColor: ColorConstant.primary,
      elevation: 0,
      automaticallyImplyLeading: false,
      leading: IconButton(
        icon: SvgPicture.asset(
          'ic_drawer'.iconSvg,
          width: 20,
          height: 16,
        ),
        onPressed: () => widget.onOpenDrawer?.call(),
        tooltip: 'Open menu',
      ),
      title: Text(
        _appBarTitle,
        style: TextStyleConstant.quicksandW700(
          fontSize: 18,
          color: Colors.white,
        ),
      ),
      actions: [
        // Sync — triggers dashboard refresh.
        IconButton(
          icon: _refreshing
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : SvgPicture.asset(
                  'ic_sync'.iconSvg,
                  width: 20,
                  height: 20,
                ),
          onPressed: _loadStats,
          tooltip: AppLang.local.sync,
        ),
        // Notification bell.
        IconButton(
          icon: SvgPicture.asset(
            'ic_bell'.iconSvg,
            width: 20,
            height: 20,
          ),
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('No new notifications'),
                backgroundColor: ColorConstant.info,
              ),
            );
          },
          tooltip: 'Notifications',
        ),
        // Profile avatar.
        Padding(
          padding: const EdgeInsets.only(right: 12),
          child: GestureDetector(
            onTap: () => Navigator.of(context).pushNamed(RouterName.profile),
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.18),
                border: Border.all(color: Colors.white54, width: 1),
              ),
              alignment: Alignment.center,
              child: Text(
                _userInitials,
                style: TextStyleConstant.quicksandW700(
                  fontSize: 12,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 4),
      ],
      // Coffee-brown gradient + dashboard_bg.png watermark fills the
      // expanded area when the SliverAppBar is at the top.
      flexibleSpace: FlexibleSpaceBar(
        background: DecoratedBox(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [ColorConstant.primary, ColorConstant.primaryDark],
            ),
          ),
          child: Opacity(
            opacity: 0.08,
            child: Image.asset(
              'dashboard_bg'.imgPNG,
              fit: BoxFit.cover,
              width: double.infinity,
              height: double.infinity,
            ),
          ),
        ),
      ),
    );
  }

  // ─── KPI sliver ────────────────────────────────────────────────────────────

  Widget _buildKpiSliver() {
    final cards = _buildKpiCards();
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  AppLang.local.overview,
                  style: TextStyleConstant.robotoW600(
                    fontSize: 15,
                    color: ColorConstant.heading,
                  ),
                ),
                if (_refreshing)
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: ColorConstant.primary,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            // 2x2 grid of shadow cards.
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.35,
              ),
              itemCount: cards.length,
              itemBuilder: (_, i) => _KpiCardView(card: cards[i]),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Today Tasks sliver ─────────────────────────────────────────────────────

  Widget _buildTodayTasksSliver() {
    final tasks = _buildTodayTasks();
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.only(top: 16, bottom: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    AppLang.local.today_tasks,
                    style: TextStyleConstant.robotoW600(
                      fontSize: 15,
                      color: ColorConstant.heading,
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('All tasks view coming soon'),
                          backgroundColor: ColorConstant.info,
                        ),
                      );
                    },
                    child: Text(
                      AppLang.local.view_all_tasks,
                      style: TextStyleConstant.robotoW500(
                        fontSize: 12,
                        color: ColorConstant.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 132,
              child: tasks.isEmpty
                  ? _buildEmptyTasks()
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      scrollDirection: Axis.horizontal,
                      itemCount: tasks.length,
                      separatorBuilder: (_, __) =>
                          const SizedBox(width: 12),
                      itemBuilder: (_, i) => _TaskCardView(card: tasks[i]),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyTasks() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: ColorConstant.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: ColorConstant.grayEB,
            style: BorderStyle.solid,
          ),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.event_available,
                color: ColorConstant.textSecondary,
                size: 28,
              ),
              const SizedBox(height: 8),
              Text(
                'No tasks for today',
                style: TextStyleConstant.robotoW500(
                  fontSize: 13,
                  color: ColorConstant.text79,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Recent activity sliver (extra section under tasks) ────────────────────

  Widget _buildActivitySliver() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: ColorConstant.surface,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
            border: Border.all(color: ColorConstant.grayEB),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                AppLang.local.activity_history,
                style: TextStyleConstant.robotoW600(
                  fontSize: 15,
                  color: ColorConstant.heading,
                ),
              ),
              const SizedBox(height: 12),
              _ActivityRow(
                icon: Icons.person_add_alt_1_outlined,
                color: ColorConstant.secondary,
                title: _isZiwa360
                    ? 'New staff onboarded'
                    : 'New farmer enrolled',
                time: '2 hours ago',
              ),
              const _ActivityDivider(),
              _ActivityRow(
                icon: Icons.check_circle_outline,
                color: ColorConstant.success,
                title: _isZiwa360
                    ? 'Milk yield recorded'
                    : 'Training attendance synced',
                time: '4 hours ago',
              ),
              const _ActivityDivider(),
              _ActivityRow(
                icon: Icons.sync_alt,
                color: ColorConstant.info,
                title: _isZiwa360
                    ? 'Vaccination log synced'
                    : 'Procurement pickup logged',
                time: 'Yesterday',
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Error state ──────────────────────────────────────────────────────────

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.error_outline,
              size: 48,
              color: ColorConstant.danger,
            ),
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
              child: Text(AppLang.local.retry),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── KPI card model + view ──────────────────────────────────────────────────

class _KpiCard {
  const _KpiCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final int value;
  final IconData icon;
  final Color color;
}

class _KpiCardView extends StatelessWidget {
  const _KpiCardView({required this.card});
  final _KpiCard card;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ColorConstant.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: card.color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(card.icon, color: card.color, size: 18),
              ),
              Icon(
                Icons.more_horiz,
                color: ColorConstant.textSecondary.withOpacity(0.5),
                size: 16,
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _formatValue(card.value),
                style: TextStyleConstant.quicksandW700(
                  fontSize: 22,
                  color: ColorConstant.heading,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                card.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
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
  }

  String _formatValue(int v) {
    if (v >= 1000) {
      final k = (v / 1000).toStringAsFixed(v % 1000 == 0 ? 0 : 1);
      return '${k}k';
    }
    return '$v';
  }
}

// ─── Task card model + view ──────────────────────────────────────────────────

class _TaskCard {
  const _TaskCard({
    required this.title,
    required this.subtitle,
    required this.color,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final Color color;
  final IconData icon;
}

class _TaskCardView extends StatelessWidget {
  const _TaskCardView({required this.card});
  final _TaskCard card;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 220,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ColorConstant.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: card.color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(card.icon, color: card.color, size: 16),
              ),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: ColorConstant.warning.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  'Today',
                  style: TextStyleConstant.robotoW500(
                    fontSize: 10,
                    color: ColorConstant.warning,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            card.title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyleConstant.quicksandW700(
              fontSize: 14,
              color: ColorConstant.heading,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            card.subtitle,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyleConstant.robotoW400(
              fontSize: 11,
              color: ColorConstant.text79,
            ),
          ),
          const Spacer(),
          Row(
            children: [
              Icon(
                Icons.access_time,
                size: 12,
                color: ColorConstant.textSecondary,
              ),
              const SizedBox(width: 4),
              Text(
                '08:00 AM',
                style: TextStyleConstant.robotoW400(
                  fontSize: 10,
                  color: ColorConstant.textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Activity row helpers ───────────────────────────────────────────────────

class _ActivityRow extends StatelessWidget {
  const _ActivityRow({
    required this.icon,
    required this.color,
    required this.title,
    required this.time,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String time;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            alignment: Alignment.center,
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyleConstant.robotoW500(
                    fontSize: 13,
                    color: ColorConstant.textPrimary,
                  ),
                ),
                Text(
                  time,
                  style: TextStyleConstant.robotoW400(
                    fontSize: 11,
                    color: ColorConstant.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.chevron_right,
            color: ColorConstant.textSecondary.withOpacity(0.6),
            size: 20,
          ),
        ],
      ),
    );
  }
}

class _ActivityDivider extends StatelessWidget {
  const _ActivityDivider();

  @override
  Widget build(BuildContext context) {
    return const Divider(
      height: 1,
      thickness: 1,
      color: ColorConstant.grayEB,
    );
  }
}
