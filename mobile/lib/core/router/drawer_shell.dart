import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../navigation/dynamic_navigation_service.dart';
import '../auth/auth_provider.dart';

/// DrawerShell — replaces FabMenuShell with a professional sidebar drawer.
///
/// Design:
///   - Hamburger icon (top-left) opens a drawer sidebar
///   - Drawer: user info header + scrollable module list (Sales, Purchase,
///     Loans, Trainings, Compliance, Impact, Profile, etc.)
///   - Top app bar: [hamburger] [title] [sync icon] [profile avatar]
///   - Small FAB (bottom-right) with 3 quick actions only:
///     Add Farmer, Add Farm Land, Add Cultivation
///   - FAB uses a radial burst animation
class DrawerShell extends StatefulWidget {
  final StatefulNavigationShell navigationShell;

  const DrawerShell({super.key, required this.navigationShell});

  @override
  State<DrawerShell> createState() => _DrawerShellState();
}

class _DrawerShellState extends State<DrawerShell>
    with SingleTickerProviderStateMixin {
  late AnimationController _fabController;
  bool _fabOpen = false;

  @override
  void initState() {
    super.initState();
    _fabController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _fabController.dispose();
    super.dispose();
  }

  void _toggleFab() {
    if (_fabOpen) {
      _fabController.reverse();
    } else {
      _fabController.forward();
    }
    setState(() => _fabOpen = !_fabOpen);
  }

  void _closeFab() {
    if (_fabOpen) {
      _fabController.reverse();
      setState(() => _fabOpen = false);
    }
  }

  void _navigateTo(NavDestination dest) {
    final branchIndex = _keyToBranchIndex[dest.key] ?? 0;
    widget.navigationShell.goBranch(branchIndex);
    Navigator.of(context).pop(); // close drawer
  }

  @override
  Widget build(BuildContext context) {
    final navService = context.watch<DynamicNavigationService>();
    final auth = context.watch<AuthState>();
    final destinations = navService.destinations.isNotEmpty
        ? navService.destinations
        : [
            NavDestination(key: 'dashboard', label: 'Home', icon: 'dashboard', route: '/'),
            NavDestination(key: 'farmers', label: 'Farmers', icon: 'people', route: '/farmers'),
            NavDestination(key: 'profile', label: 'Profile', icon: 'person', route: '/profile'),
          ];

    // Drawer items: everything EXCEPT dashboard (it's the home button)
    final drawerItems = destinations.where((d) => d.key != 'dashboard').toList();

    // Find current destination
    int currentBranch = widget.navigationShell.currentIndex;
    String currentLabel = 'Home';
    for (final d in destinations) {
      final branch = _keyToBranchIndex[d.key] ?? 0;
      if (branch == currentBranch) {
        currentLabel = d.label;
        break;
      }
    }

    final theme = Theme.of(context);

    return Scaffold(
      // ─── Drawer (sidebar) ───
      drawer: Drawer(
        width: 280,
        child: SafeArea(
          child: Column(
            children: [
              // User header
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      theme.colorScheme.primary,
                      theme.colorScheme.primary.withValues(alpha: 0.8),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: Colors.white.withValues(alpha: 0.2),
                      child: Text(
                        (auth.userName?.isNotEmpty == true)
                            ? auth.userName!.split(' ').map((n) => n[0]).take(2).join()
                            : '?',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      auth.userName ?? 'User',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      auth.role ?? '',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.7),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              // Navigation items
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: drawerItems.length,
                  itemBuilder: (context, index) {
                    final dest = drawerItems[index];
                    final branch = _keyToBranchIndex[dest.key] ?? 0;
                    final isActive = branch == currentBranch;
                    return _DrawerTile(
                      icon: dest.iconData,
                      label: dest.label,
                      isActive: isActive,
                      onTap: () => _navigateTo(dest),
                    );
                  },
                ),
              ),
              // Logout button
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: const Text('Logout', style: TextStyle(color: Colors.red)),
                onTap: () {
                  Navigator.of(context).pop();
                  auth.logout();
                  context.go('/login');
                },
              ),
            ],
          ),
        ),
      ),
      // ─── Top app bar ───
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(56),
        child: AppBar(
          backgroundColor: theme.colorScheme.surface,
          surfaceTintColor: theme.colorScheme.surfaceTint,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.menu),
            tooltip: 'Menu',
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
          title: Text(
            currentLabel,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface,
            ),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.sync, size: 22),
              tooltip: 'Sync',
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Syncing…'), duration: Duration(seconds: 2)),
                );
              },
            ),
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: () {
                  final profileBranch = _keyToBranchIndex['profile'] ?? 14;
                  widget.navigationShell.goBranch(profileBranch);
                },
                child: CircleAvatar(
                  radius: 16,
                  backgroundColor: theme.colorScheme.primary.withValues(alpha: 0.1),
                  child: Icon(Icons.person, size: 18, color: theme.colorScheme.primary),
                ),
              ),
            ),
          ],
        ),
      ),
      // ─── Body ───
      body: Stack(
        children: [
          GestureDetector(
            onTap: _closeFab,
            child: widget.navigationShell,
          ),
          // Dimmed overlay when FAB is open
          if (_fabOpen)
            AnimatedBuilder(
              animation: _fabController,
              builder: (context, _) {
                final opacity = (_fabController.value * 0.4).clamp(0.0, 1.0);
                if (opacity < 0.01) return const SizedBox.shrink();
                return GestureDetector(
                  onTap: _closeFab,
                  child: Container(color: Colors.black.withValues(alpha: opacity)),
                );
              },
            ),
          // FAB with 3 quick actions
          _buildQuickActionsFab(theme),
        ],
      ),
    );
  }

  /// Small FAB with only 3 quick actions: Add Farmer, Add Farm Land, Add Cultivation
  Widget _buildQuickActionsFab(ThemeData theme) {
    const actions = <_QuickAction>[
      _QuickAction(icon: Icons.person_add, label: 'New Farmer', branchIndex: 2),
      _QuickAction(icon: Icons.landscape, label: 'New Farm', branchIndex: 3),
      _QuickAction(icon: Icons.spa, label: 'New Cultivation', branchIndex: 4),
    ];

    final angleStep = 90.0 / (actions.length - 1);
    final startAngle = 180.0;

    return Positioned(
      bottom: 24,
      right: 24,
      child: SizedBox(
        width: 180,
        height: 180,
        child: Stack(
          alignment: Alignment.bottomRight,
          children: [
            // Action buttons
            for (int i = 0; i < actions.length; i++)
              _buildQuickActionButton(
                action: actions[i],
                angle: startAngle + (angleStep * i),
                theme: theme,
                index: i,
                total: actions.length,
              ),
            // Main FAB
            AnimatedBuilder(
              animation: _fabController,
              builder: (context, child) {
                return Transform.rotate(
                  angle: _fabController.value * 0.785, // 45° rotation
                  child: child,
                );
              },
              child: GestureDetector(
                onTap: _toggleFab,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        theme.colorScheme.primary,
                        theme.colorScheme.primary.withValues(alpha: 0.8),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: theme.colorScheme.primary.withValues(alpha: 0.3),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Icon(
                    _fabOpen ? Icons.close : Icons.add,
                    color: Colors.white,
                    size: 26,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionButton({
    required _QuickAction action,
    required double angle,
    required ThemeData theme,
    required int index,
    required int total,
  }) {
    final staggerDelay = (index / total) * 0.3;
    final staggerEnd = staggerDelay + 0.7;

    final anim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _fabController,
        curve: Interval(staggerDelay, staggerEnd.clamp(0.0, 1.0), curve: Curves.easeOut),
      ),
    );

    return AnimatedBuilder(
      animation: anim,
      builder: (context, child) {
        final value = anim.value;
        if (value < 0.01) return const SizedBox.shrink();

        final radians = angle * 3.14159 / 180;
        return Transform.translate(
          offset: Offset.fromDirection(radians, value * 80),
          child: Transform.scale(
            scale: value,
            child: child,
          ),
        );
      },
      child: GestureDetector(
        onTap: () {
          _closeFab();
          widget.navigationShell.goBranch(action.branchIndex);
        },
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: Text(
                action.label,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(action.icon, size: 18, color: theme.colorScheme.primary),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickAction {
  final IconData icon;
  final String label;
  final int branchIndex;
  const _QuickAction({required this.icon, required this.label, required this.branchIndex});
}

class _DrawerTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _DrawerTile({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isActive
                ? theme.colorScheme.primary.withValues(alpha: 0.08)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              Icon(
                icon,
                size: 22,
                color: isActive
                    ? theme.colorScheme.primary
                    : theme.colorScheme.onSurface.withValues(alpha: 0.6),
              ),
              const SizedBox(width: 14),
              Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                  color: isActive
                      ? theme.colorScheme.primary
                      : theme.colorScheme.onSurface.withValues(alpha: 0.8),
                ),
              ),
              if (isActive) ...[
                const Spacer(),
                Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

const _keyToBranchIndex = <String, int>{
  'dashboard': 0,
  'plots': 1,
  'farmers': 2,
  'farm_lands': 3,
  'purchases': 4,
  'payments': 5,
  'loans': 6,
  'vsla': 7,
  'sacco': 8,
  'reset': 9,
  'mfi': 10,
  'carbon': 11,
  'compliance': 12,
  'impact': 13,
  'trainings': 13,
  'profile': 14,
};
