import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/data/dairy_modules.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';
import 'package:mobipay_ekibbo/screens/dashboard/views/dashboard_screen.dart';

/// MainShell — the host Scaffold that wraps the dashboard with the
/// left navigation Drawer and a speed-dial FloatingActionButton.
///
/// Mirrors the Farm Angel Upstream design:
///   - Drawer slides in from the LEFT (not a bottom nav bar).
///   - The drawer header shows the user's initials avatar, name + role.
///   - Tenant-specific menu items are shown for EKiBBO / ZIWA360 / others.
///   - A bottom cluster (Settings, Sync, Sign Out) sits below a divider.
///   - The FAB is a speed dial: tapping it expands an overlay with 3 action
///     pills (Add Farmer / Add Farm Land / Add Training for EKiBBO,
///     Add Cow / Add Staff / Add Milking Record for ZIWA360). Tapping the
///     FAB again or tapping outside dismisses the overlay.
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell>
    with SingleTickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final GlobalKey<DashboardScreenState> _dashboardKey =
      GlobalKey<DashboardScreenState>();

  /// Whether the speed-dial overlay is open.
  bool _speedDialOpen = false;

  /// Simple fade/scale animation for the overlay reveal.
  late final AnimationController _dialAnim;
  late final Animation<double> _dialFade;

  @override
  void initState() {
    super.initState();
    _dialAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 180),
    );
    _dialFade = CurvedAnimation(
      parent: _dialAnim,
      curve: Curves.easeOutCubic,
    );
  }

  @override
  void dispose() {
    _dialAnim.dispose();
    super.dispose();
  }

  // ─── Public hooks used by drawer items + dashboard app bar ────────────────

  void _openDrawer() => _scaffoldKey.currentState?.openDrawer();

  void _closeDrawer() => _scaffoldKey.currentState?.closeDrawer();

  Future<void> _triggerSync() async {
    _closeDrawer();
    await Future<void>.delayed(const Duration(milliseconds: 200));
    _dashboardKey.currentState?.refreshStats();
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(AppLang.local.sign_out),
        content: Text(AppLang.local.confirm_logout_msg),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(AppLang.local.cancel),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: ColorConstant.danger),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(AppLang.local.sign_out),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await ApiClient().clearSession();
    ApiClient().clearAuth();
    if (!mounted) return;
    navigatorKey.currentState?.pushReplacementNamed(RouterName.login);
  }

  // ─── Speed dial ───────────────────────────────────────────────────────────

  void _toggleSpeedDial() {
    if (!mounted) return;
    setState(() => _speedDialOpen = !_speedDialOpen);
    if (_speedDialOpen) {
      _dialAnim.forward();
    } else {
      _dialAnim.reverse();
    }
  }

  void _closeSpeedDial() {
    if (!_speedDialOpen) return;
    if (!mounted) return;
    setState(() => _speedDialOpen = false);
    _dialAnim.reverse();
  }

  /// Tenant-aware speed-dial action list.
  List<_SpeedDialAction> _speedDialActions() {
    final isZiwa360 = ApiClient().tenantId == DairyModules.ziwa360TenantId;
    if (isZiwa360) {
      return [
        _SpeedDialAction(
          label: 'Add Cow',
          icon: Icons.pets,
          color: ColorConstant.primary,
          route: RouterName.dairyDashboard,
        ),
        _SpeedDialAction(
          label: 'Add Staff',
          icon: Icons.badge_outlined,
          color: ColorConstant.secondary,
          route: RouterName.profile,
        ),
        _SpeedDialAction(
          label: 'Add Milking Record',
          icon: Icons.water_drop_outlined,
          color: ColorConstant.gold,
          route: RouterName.dairyDashboard,
        ),
      ];
    }
    return [
      _SpeedDialAction(
        label: AppLang.local.add_farmer,
        icon: Icons.person_add_outlined,
        color: ColorConstant.secondary,
        route: RouterName.farmerRegistration,
      ),
      _SpeedDialAction(
        label: AppLang.local.farm_land,
        icon: Icons.landscape_outlined,
        color: ColorConstant.primary,
        route: RouterName.farmLandForm,
      ),
      _SpeedDialAction(
        label: AppLang.local.add_training,
        icon: Icons.school_outlined,
        color: ColorConstant.gold,
        route: RouterName.trainingForm,
      ),
    ];
  }

  Widget _buildFab() {
    return FloatingActionButton(
      onPressed: _toggleSpeedDial,
      backgroundColor: ColorConstant.primary,
      foregroundColor: Colors.white,
      elevation: 4,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 200),
        transitionBuilder: (child, anim) => RotationTransition(
          turns: child.key == const ValueKey('close')
              ? Tween<double>(begin: 0.5, end: 0.0).animate(anim)
              : Tween<double>(begin: -0.5, end: 0.0).animate(anim),
          child: ScaleTransition(scale: anim, child: child),
        ),
        child: _speedDialOpen
            ? const Icon(Icons.close, key: ValueKey('close'))
            : const Icon(Icons.add, key: ValueKey('add')),
      ),
    );
  }

  Widget _buildSpeedDialOverlay() {
    final actions = _speedDialActions();
    return Positioned.fill(
      child: FadeTransition(
        opacity: _dialFade,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: _closeSpeedDial,
          child: Container(
            color: Colors.black.withOpacity(0.45),
            child: Align(
              alignment: Alignment.bottomRight,
              child: Padding(
                padding: const EdgeInsets.only(
                  bottom: 88,
                  right: 20,
                  left: 20,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    for (int i = 0; i < actions.length; i++)
                      _SpeedDialItem(
                        action: actions[i],
                        fadeIn: _dialFade,
                        index: i,
                        onTap: () {
                          _closeSpeedDial();
                          final route = actions[i].route;
                          if (route != null) {
                            Navigator.of(context).pushNamed(route);
                          }
                        },
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ─── Drawer ──────────────────────────────────────────────────────────────

  Widget _buildDrawerHeader() {
    final tenantName = _tenantDisplayName();
    final role = _roleDisplayName();
    final initials = _userInitials();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [ColorConstant.primary, ColorConstant.primaryDark],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withOpacity(0.18),
              border: Border.all(color: Colors.white54, width: 1.5),
            ),
            alignment: Alignment.center,
            child: Text(
              initials,
              style: TextStyleConstant.quicksandW700(
                fontSize: 22,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            tenantName,
            style: TextStyleConstant.quicksandW700(
              fontSize: 16,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            role,
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: Colors.white.withOpacity(0.85),
            ),
          ),
        ],
      ),
    );
  }

  String _tenantDisplayName() {
    final tid = ApiClient().tenantId;
    if (tid == DairyModules.ziwa360TenantId) return 'ZIWA360 Officer';
    return 'EKiBBO Field Officer';
  }

  String _roleDisplayName() {
    final tid = ApiClient().tenantId;
    if (tid == DairyModules.ziwa360TenantId) return 'Dairy · Field Officer';
    return 'Coffee · Field Officer';
  }

  String _userInitials() {
    final tid = ApiClient().tenantId;
    return tid == DairyModules.ziwa360TenantId ? 'Z3' : 'FO';
  }

  /// Tenant-aware drawer menu items (top section, above divider).
  List<_DrawerItem> _drawerMenuItems() {
    final isZiwa360 = ApiClient().tenantId == DairyModules.ziwa360TenantId;
    final items = <_DrawerItem>[
      _DrawerItem(
        label: AppLang.local.dashboard,
        icon: Icons.dashboard_outlined,
        onTap: _closeDrawer,
      ),
    ];
    if (isZiwa360) {
      items.add(
        _DrawerItem(
          label: 'Dairy (ZIWA360)',
          icon: Icons.water_drop_outlined,
          color: ColorConstant.primary,
          route: RouterName.dairyDashboard,
        ),
      );
    } else {
      items.addAll([
        _DrawerItem(
          label: AppLang.local.farmers,
          icon: Icons.people_outline,
          color: ColorConstant.secondary,
          route: RouterName.farmersList,
        ),
        _DrawerItem(
          label: AppLang.local.farm_lands,
          icon: Icons.landscape_outlined,
          color: ColorConstant.primaryLight,
          route: RouterName.farmLandsList,
        ),
        _DrawerItem(
          label: AppLang.local.trainings,
          icon: Icons.school_outlined,
          color: ColorConstant.gold,
          route: RouterName.trainingsList,
        ),
        _DrawerItem(
          label: AppLang.local.crops,
          icon: Icons.grass_outlined,
          color: ColorConstant.secondaryLight,
          route: RouterName.cropsList,
        ),
        _DrawerItem(
          label: AppLang.local.procurement_list,
          icon: Icons.shopping_cart_outlined,
          color: ColorConstant.gold,
          route: RouterName.procurementList,
        ),
        _DrawerItem(
          label: AppLang.local.transactions_list,
          icon: Icons.receipt_long_outlined,
          color: ColorConstant.info,
          route: RouterName.transactionsList,
        ),
        _DrawerItem(
          label: AppLang.local.breakdowns_dashboard,
          icon: Icons.bar_chart_outlined,
          color: ColorConstant.info,
          route: RouterName.breakdownsDashboard,
        ),
        _DrawerItem(
          label: AppLang.local.qr_scan,
          icon: Icons.qr_code_scanner,
          color: ColorConstant.gold,
          route: RouterName.qrScan,
        ),
        _DrawerItem(
          label: AppLang.local.vehicles_list,
          icon: Icons.local_shipping_outlined,
          color: ColorConstant.textSecondary,
          route: RouterName.vehiclesList,
        ),
      ]);
    }
    // Always show Profile in the top menu (all tenants).
    items.add(
      _DrawerItem(
        label: AppLang.local.profile,
        icon: Icons.person_outline,
        color: ColorConstant.primaryLight,
        route: RouterName.profile,
      ),
    );
    return items;
  }

  /// Bottom drawer items (below the divider): Settings, Sync, Sign Out.
  List<_DrawerItem> _drawerBottomItems() {
    return [
      _DrawerItem(
        label: AppLang.local.settings,
        icon: Icons.settings_outlined,
        color: ColorConstant.textSecondary,
        route: RouterName.settings,
      ),
      _DrawerItem(
        label: AppLang.local.sync,
        icon: Icons.sync_outlined,
        color: ColorConstant.info,
        onTap: _triggerSync,
      ),
      _DrawerItem(
        label: AppLang.local.sign_out,
        icon: Icons.logout,
        color: ColorConstant.danger,
        onTap: _logout,
      ),
    ];
  }

  Widget _drawerTile(_DrawerItem item) {
    return ListTile(
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
      leading: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: item.color.withOpacity(0.12),
          borderRadius: BorderRadius.circular(8),
        ),
        alignment: Alignment.center,
        child: Icon(item.icon, color: item.color, size: 18),
      ),
      title: Text(
        item.label,
        style: TextStyleConstant.robotoW500(
          fontSize: 14,
          color: ColorConstant.textPrimary,
        ),
      ),
      onTap: () {
        _closeDrawer();
        // Delay so the drawer close animation can start before navigation.
        if (item.onTap != null) {
          item.onTap!();
        } else if (item.route != null) {
          Navigator.of(context).pushNamed(item.route!);
        }
      },
    );
  }

  Widget _buildDrawer() {
    final menuItems = _drawerMenuItems();
    final bottomItems = _drawerBottomItems();
    return Drawer(
      backgroundColor: ColorConstant.surface,
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            _buildDrawerHeader(),
            const Divider(height: 1, color: ColorConstant.grayEB),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: menuItems.length,
                itemBuilder: (_, i) => _drawerTile(menuItems[i]),
              ),
            ),
            const Divider(height: 1, color: ColorConstant.grayEB),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (final it in bottomItems) _drawerTile(it),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(left: 20, bottom: 12, top: 4),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  '${AppLang.local.version} 1.0.0+1',
                  style: TextStyleConstant.robotoW400(
                    fontSize: 11,
                    color: ColorConstant.textSecondary,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Build ────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: ColorConstant.background,
      drawer: _buildDrawer(),
      body: Stack(
        children: [
          DashboardScreen(
            key: _dashboardKey,
            onOpenDrawer: _openDrawer,
          ),
          if (_speedDialOpen) _buildSpeedDialOverlay(),
        ],
      ),
      floatingActionButton: _buildFab(),
    );
  }
}

// ─── Internal model classes ─────────────────────────────────────────────────

class _DrawerItem {
  const _DrawerItem({
    required this.label,
    required this.icon,
    this.color = ColorConstant.heading,
    this.route,
    this.onTap,
  });

  final String label;
  final IconData icon;
  final Color color;
  final String? route;
  final VoidCallback? onTap;
}

class _SpeedDialAction {
  const _SpeedDialAction({
    required this.label,
    required this.icon,
    required this.color,
    this.route,
  });

  final String label;
  final IconData icon;
  final Color color;
  final String? route;
}

class _SpeedDialItem extends StatelessWidget {
  const _SpeedDialItem({
    required this.action,
    required this.onTap,
    required this.fadeIn,
    required this.index,
  });

  final _SpeedDialAction action;
  final VoidCallback onTap;
  final Animation<double> fadeIn;
  final int index;

  @override
  Widget build(BuildContext context) {
    // Stagger the appearance slightly so each item pops in sequence.
    final stagger = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: fadeIn,
        curve: Interval(
          (index * 0.15).clamp(0.0, 0.85),
          1.0,
          curve: Curves.easeOutCubic,
        ),
      ),
    );
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Label pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.18),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Text(
              action.label,
              style: TextStyleConstant.robotoW600(
                fontSize: 13,
                color: ColorConstant.heading,
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Mini FAB-style circular button
          ScaleTransition(
            scale: stagger,
            child: GestureDetector(
              onTap: onTap,
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: action.color,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: action.color.withOpacity(0.45),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Icon(action.icon, color: Colors.white, size: 22),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
