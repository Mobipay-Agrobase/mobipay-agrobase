import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../navigation/dynamic_navigation_service.dart';

/// FabMenuShell — replaces the old BottomNavigationBar with a clean
/// floating action button that opens an animated speed-dial menu.
///
/// Design:
///   - A single FAB in the bottom-right corner (always visible)
///   - Tapping the FAB opens a radial/sheet menu with all destinations
///   - The current destination is highlighted with a label in the top bar
///   - Only 3 items are in the bottom bar: Home (always left), active module
///     (center, dynamic), Profile (always right) — keeping it clean
///   - The FAB opens the full menu (all destinations from the nav config)
///
/// This replaces ScaffoldWithNavBar in app_router.dart.
class FabMenuShell extends StatefulWidget {
  final StatefulNavigationShell navigationShell;

  const FabMenuShell({super.key, required this.navigationShell});

  @override
  State<FabMenuShell> createState() => _FabMenuShellState();
}

class _FabMenuShellState extends State<FabMenuShell>
    with SingleTickerProviderStateMixin {
  bool _menuOpen = false;
  late AnimationController _animController;
  late Animation<double> _scaleAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      duration: const Duration(milliseconds: 250),
      vsync: this,
    );
    _scaleAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutBack,
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOut,
    ));
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _toggleMenu() {
    if (_menuOpen) {
      _animController.reverse();
      setState(() => _menuOpen = false);
    } else {
      _animController.forward();
      setState(() => _menuOpen = true);
    }
  }

  void _closeMenu() {
    if (_menuOpen) {
      _animController.reverse();
      setState(() => _menuOpen = false);
    }
  }

  void _navigateTo(NavDestination dest) {
    _closeMenu();
    final branchIndex = _keyToBranchIndex[dest.key] ?? 0;
    widget.navigationShell.goBranch(branchIndex);
  }

  @override
  Widget build(BuildContext context) {
    final navService = context.watch<DynamicNavigationService>();
    final destinations = navService.destinations.isNotEmpty
        ? navService.destinations
        : [
            NavDestination(
                key: 'dashboard', label: 'Home', icon: 'dashboard', route: '/'),
            NavDestination(
                key: 'farmers',
                label: 'Farmers',
                icon: 'people',
                route: '/farmers'),
            NavDestination(
                key: 'profile',
                label: 'Profile',
                icon: 'person',
                route: '/profile'),
          ];

    // Find current destination label for the top bar
    int currentBranch = widget.navigationShell.currentIndex;
    String currentLabel = 'Home';
    IconData currentIcon = Icons.dashboard;
    for (final d in destinations) {
      final branch = _keyToBranchIndex[d.key] ?? 0;
      if (branch == currentBranch) {
        currentLabel = d.label;
        currentIcon = d.iconData;
        break;
      }
    }

    return Scaffold(
      body: GestureDetector(
        onTap: _closeMenu,
        child: widget.navigationShell,
      ),
      // ─── Minimal bottom bar: Home | Active Module | Profile ───
      // Only 3 slots — clean, modern, space-efficient
      bottomNavigationBar: Container(
        height: 64,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 8,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            // Home button (always first)
            _BottomBarItem(
              icon: Icons.dashboard,
              label: 'Home',
              isActive: currentBranch == 0,
              onTap: () => widget.navigationShell.goBranch(0),
            ),
            // Active module (center, dynamic)
            _BottomBarItem(
              icon: currentIcon,
              label: currentLabel,
              isActive: false, // center is never "active" — it's just a label
              onTap: _toggleMenu,
            ),
            // Profile (always last)
            _BottomBarItem(
              icon: Icons.person,
              label: 'Profile',
              isActive: currentBranch ==
                  (_keyToBranchIndex['profile'] ?? 14),
              onTap: () {
                final profileBranch = _keyToBranchIndex['profile'] ?? 14;
                widget.navigationShell.goBranch(profileBranch);
              },
            ),
          ],
        ),
      ),
      // ─── FAB for opening the full menu ───
      floatingActionButton: FloatingActionButton(
        onPressed: _toggleMenu,
        backgroundColor: Theme.of(context).colorScheme.primary,
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: _menuOpen
              ? const Icon(Icons.close, key: ValueKey('close'), color: Colors.white)
              : const Icon(Icons.apps, key: ValueKey('menu'), color: Colors.white),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      // ─── Animated overlay menu ───
      // Renders above everything when _menuOpen is true
      bottomSheet: _menuOpen
          ? _buildMenuOverlay(destinations, currentBranch)
          : null,
    );
  }

  Widget _buildMenuOverlay(List<NavDestination> destinations, int currentBranch) {
    return AnimatedBuilder(
      animation: _animController,
      builder: (context, child) {
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 80),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.4 * _animController.value),
          ),
          child: Align(
            alignment: Alignment.bottomCenter,
            child: SlideTransition(
              position: _slideAnim,
              child: ScaleTransition(
                scale: _scaleAnim,
                child: _buildMenuGrid(destinations, currentBranch),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildMenuGrid(List<NavDestination> destinations, int currentBranch) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 360),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Text(
                'Menu',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: _closeMenu,
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Grid of destinations
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              childAspectRatio: 1,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: destinations.length,
            itemBuilder: (context, index) {
              final dest = destinations[index];
              final branch = _keyToBranchIndex[dest.key] ?? 0;
              final isActive = branch == currentBranch;
              return _MenuTile(
                icon: dest.iconData,
                label: dest.label,
                isActive: isActive,
                onTap: () => _navigateTo(dest),
              );
            },
          ),
        ],
      ),
    );
  }
}

/// A single tile in the menu grid
class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _MenuTile({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            color: isActive
                ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.1)
                : Theme.of(context).colorScheme.surfaceContainerHighest
                    .withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(16),
            border: isActive
                ? Border.all(
                    color: Theme.of(context).colorScheme.primary
                        .withValues(alpha: 0.3),
                    width: 1.5,
                  )
                : null,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 28,
                color: isActive
                    ? Theme.of(context).colorScheme.primary
                    : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                  color: isActive
                      ? Theme.of(context).colorScheme.primary
                      : Theme.of(context).colorScheme.onSurface
                          .withValues(alpha: 0.7),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A bottom bar item (Home | Active | Profile)
class _BottomBarItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _BottomBarItem({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 22,
              color: isActive
                  ? Theme.of(context).colorScheme.primary
                  : Theme.of(context).colorScheme.onSurface
                      .withValues(alpha: 0.5),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                color: isActive
                    ? Theme.of(context).colorScheme.primary
                    : Theme.of(context).colorScheme.onSurface
                        .withValues(alpha: 0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Map from destination key to branch index — must match app_router.dart
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
  'trainings': 13, // trainings maps to impact branch (fallback)
  'profile': 14,
};
