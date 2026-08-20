import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../navigation/dynamic_navigation_service.dart';
import '../auth/auth_provider.dart';

/// DrawerShell — professional sidebar drawer navigation.
///
/// Design:
///   - Hamburger icon (top-left) opens drawer via ScaffoldContext (safe)
///   - Drawer: user info header + scrollable module list + logout
///   - Top app bar: [hamburger] [title] [sync] [profile avatar]
///   - NO floating action button (removed — causes overlap issues)
///   - "Add Farmer" etc. are accessed via the Farmers page's own FAB
///     or the drawer's module navigation
class DrawerShell extends StatefulWidget {
  final StatefulNavigationShell navigationShell;

  const DrawerShell({super.key, required this.navigationShell});

  @override
  State<DrawerShell> createState() => _DrawerShellState();
}

class _DrawerShellState extends State<DrawerShell> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  void _navigateTo(NavDestination dest) {
    final branchIndex = _keyToBranchIndex[dest.key] ?? 0;
    widget.navigationShell.goBranch(branchIndex);
    _scaffoldKey.currentState?.closeDrawer();
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

    // Drawer items: everything EXCEPT dashboard (home button in app bar)
    final drawerItems = destinations.where((d) => d.key != 'dashboard').toList();

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
      key: _scaffoldKey,
      // ─── Drawer ───
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
              // Logout
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: const Text('Logout', style: TextStyle(color: Colors.red)),
                onTap: () {
                  _scaffoldKey.currentState?.closeDrawer();
                  auth.logout();
                  context.go('/login');
                },
              ),
            ],
          ),
        ),
      ),
      // ─── Top app bar ───
      appBar: AppBar(
        backgroundColor: theme.colorScheme.surface,
        surfaceTintColor: theme.colorScheme.surfaceTint,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu),
          tooltip: 'Menu',
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
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
      // ─── Body (full screen, no FAB) ───
      body: widget.navigationShell,
    );
  }
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
