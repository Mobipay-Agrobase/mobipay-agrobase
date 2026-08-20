import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../navigation/dynamic_navigation_service.dart';

/// FabMenuShell — modern, minimal mobile shell.
///
/// Design:
///   - NO bottom navigation bar (clean full-screen content)
///   - Top app bar with: [sync icon] [title] [profile avatar]
///   - FAB on the bottom-right with bubble-burst animation
///   - Tapping FAB opens a radial bubble menu (items fan out upward)
///   - Only shows destinations from DynamicNavigationService
///
/// Replaces both ScaffoldWithNavBar and the previous FabMenuShell.
class FabMenuShell extends StatefulWidget {
  final StatefulNavigationShell navigationShell;

  const FabMenuShell({super.key, required this.navigationShell});

  @override
  State<FabMenuShell> createState() => _FabMenuShellState();
}

class _FabMenuShellState extends State<FabMenuShell>
    with TickerProviderStateMixin {
  bool _menuOpen = false;
  late AnimationController _fabController;
  late AnimationController _bubbleController;
  late Animation<double> _fabRotation;
  late Animation<double> _overlayOpacity;

  @override
  void initState() {
    super.initState();
    // FAB rotation (icon spins 45° to become an X)
    _fabController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _fabRotation = Tween<double>(begin: 0, end: 0.125).animate(
      CurvedAnimation(parent: _fabController, curve: Curves.easeInOut),
    );
    // Bubble items stagger in
    _bubbleController = AnimationController(
      duration: const Duration(milliseconds: 350),
      vsync: this,
    );
    _overlayOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _bubbleController, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _fabController.dispose();
    _bubbleController.dispose();
    super.dispose();
  }

  void _toggleMenu() {
    if (_menuOpen) {
      _fabController.reverse();
      _bubbleController.reverse();
      setState(() => _menuOpen = false);
    } else {
      _fabController.forward();
      _bubbleController.forward();
      setState(() => _menuOpen = true);
    }
  }

  void _closeMenu() {
    if (_menuOpen) {
      _fabController.reverse();
      _bubbleController.reverse();
      setState(() => _menuOpen = false);
    }
  }

  void _navigateTo(NavDestination dest) {
    _closeMenu();
    final branchIndex = _keyToBranchIndex[dest.key] ?? 0;
    widget.navigationShell.goBranch(branchIndex);
  }

  void _goProfile() {
    final profileBranch = _keyToBranchIndex['profile'] ?? 14;
    widget.navigationShell.goBranch(profileBranch);
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

    // Remove 'profile' and 'dashboard' from the FAB menu (they have
    // dedicated buttons in the top bar) — only show module destinations
    final menuDestinations = destinations
        .where((d) => d.key != 'dashboard' && d.key != 'profile')
        .toList();

    // Find current destination label for the top bar
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
      // ─── Top bar: [sync] [title] [profile avatar] ───
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(56),
        child: AppBar(
          backgroundColor: theme.colorScheme.surface,
          surfaceTintColor: theme.colorScheme.surfaceTint,
          elevation: 0,
          scrolledUnderElevation: 0.5,
          leading: IconButton(
            icon: const Icon(Icons.sync),
            tooltip: 'Sync',
            onPressed: () {
              // Trigger sync — the SyncStatusWidget handles the actual sync
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Syncing…'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
          ),
          title: Text(
            currentLabel,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface,
            ),
          ),
          centerTitle: false,
          actions: [
            // Profile avatar — top right
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: _goProfile,
                child: CircleAvatar(
                  radius: 18,
                  backgroundColor: theme.colorScheme.primary.withValues(alpha: 0.1),
                  child: Icon(
                    Icons.person,
                    size: 20,
                    color: theme.colorScheme.primary,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      // ─── Full-screen body (no bottom bar) ───
      body: Stack(
        children: [
          // Content
          GestureDetector(
            onTap: _closeMenu,
            child: widget.navigationShell,
          ),
          // Dimmed overlay when menu is open
          if (_menuOpen)
            AnimatedBuilder(
              animation: _overlayOpacity,
              builder: (context, _) {
                return IgnorePointer(
                  ignoring: !_menuOpen,
                  child: Container(
                    color: Colors.black.withValues(alpha: 0.4 * _overlayOpacity.value),
                  ),
                );
              },
            ),
          // Bubble menu items
          if (_menuOpen) _buildBubbleMenu(menuDestinations, context),
        ],
      ),
      // ─── FAB on the right ───
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 16, right: 4),
        child: AnimatedBuilder(
          animation: _fabRotation,
          builder: (context, child) {
            return Transform.rotate(
              angle: _fabRotation.value * 3.14159,
              child: child,
            );
          },
          child: Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  theme.colorScheme.primary,
                  theme.colorScheme.primary.withValues(alpha: 0.8),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: theme.colorScheme.primary.withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: _toggleMenu,
                borderRadius: BorderRadius.circular(20),
                child: Icon(
                  Icons.add,
                  color: Colors.white,
                  size: 30,
                ),
              ),
            ),
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }

  /// Build the bubble menu — items fan out in a vertical stack above the FAB.
  /// Each item has a staggered animation (slides up + fades in).
  Widget _buildBubbleMenu(List<NavDestination> destinations, BuildContext context) {
    final theme = Theme.of(context);
    // Show up to 7 items in the bubble menu
    final items = destinations.take(7).toList();

    return Positioned(
      bottom: 88,
      right: 16,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisSize: MainAxisSize.min,
        children: items.asMap().entries.map((entry) {
          final index = entry.key;
          final dest = entry.value;
          // Stagger: each item starts 50ms after the previous
          final delay = index * 0.08;
          final itemAnim = Tween<double>(begin: 0, end: 1).animate(
            CurvedAnimation(
              parent: _bubbleController,
              curve: Interval(delay, delay + 0.4, curve: Curves.easeOutBack),
            ),
          );

          return AnimatedBuilder(
            animation: itemAnim,
            builder: (context, child) {
              return Opacity(
                opacity: itemAnim.value,
                child: Transform.translate(
                  offset: Offset(0, 40 * (1 - itemAnim.value)),
                  child: child,
                ),
              );
            },
            child: Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _BubbleMenuItem(
                icon: dest.iconData,
                label: dest.label,
                color: theme.colorScheme.primary,
                onTap: () => _navigateTo(dest),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

/// A single bubble menu item — pill shape with icon + label.
class _BubbleMenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _BubbleMenuItem({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(28),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.15),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 20, color: color),
              ),
              const SizedBox(width: 12),
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ],
          ),
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
  'trainings': 13,
  'profile': 14,
};
