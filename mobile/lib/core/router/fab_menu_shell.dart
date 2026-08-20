import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../navigation/dynamic_navigation_service.dart';

/// FabMenuShell — modern minimal mobile shell with radial burst FAB.
///
/// Inspired by: https://github.com/taylanyildiz/FLUTTER-ANIMATION-FLOATING-ACTION-BUTTON
///
/// Design:
///   - NO bottom navigation bar (clean full-screen content)
///   - Top app bar: [sync icon] [title] [profile avatar]
///   - FAB on the bottom-right with radial burst animation
///   - Tapping FAB: main button rotates 360°, action buttons fan out in an arc
///   - Each action button has scale + translate animation (staggered)
///   - Up to 6 action buttons (module destinations)
///   - Dashboard + Profile have dedicated buttons (not in the FAB menu)
class FabMenuShell extends StatefulWidget {
  final StatefulNavigationShell navigationShell;

  const FabMenuShell({super.key, required this.navigationShell});

  @override
  State<FabMenuShell> createState() => _FabMenuShellState();
}

class _FabMenuShellState extends State<FabMenuShell>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _rotationAnimation;
  late Animation<double> _actionAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    // Main FAB rotates 360° (just like the reference repo)
    _rotationAnimation = Tween<double>(begin: 0.0, end: 360.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );

    // Action buttons scale + translate (overshoot then settle)
    _actionAnimation = TweenSequence<double>([
      TweenSequenceItem<double>(
        tween: Tween<double>(begin: 0.0, end: 1.2),
        weight: 60,
      ),
      TweenSequenceItem<double>(
        tween: Tween<double>(begin: 1.2, end: 1.0),
        weight: 40,
      ),
    ]).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  bool get _isOpen => _controller.status == AnimationStatus.completed ||
      _controller.status == AnimationStatus.forward;

  void _toggle() {
    if (_isOpen) {
      _controller.reverse();
    } else {
      _controller.forward();
    }
    setState(() {});
  }

  void _close() {
    _controller.reverse();
    setState(() {});
  }

  void _navigateTo(NavDestination dest) {
    _close();
    final branchIndex = _keyToBranchIndex[dest.key] ?? 0;
    widget.navigationShell.goBranch(branchIndex);
  }

  void _goProfile() {
    final profileBranch = _keyToBranchIndex['profile'] ?? 14;
    widget.navigationShell.goBranch(profileBranch);
  }

  void _goHome() {
    widget.navigationShell.goBranch(0);
  }

  /// Convert degrees to radians (same as the reference repo)
  double _radiansFromDegrees(double degrees) => degrees / 57.295779513;

  @override
  Widget build(BuildContext context) {
    final navService = context.watch<DynamicNavigationService>();
    final destinations = navService.destinations.isNotEmpty
        ? navService.destinations
        : [
            NavDestination(
                key: 'dashboard', label: 'Home', icon: 'dashboard', route: '/'),
            NavDestination(
                key: 'farmers', label: 'Farmers', icon: 'people', route: '/farmers'),
            NavDestination(
                key: 'profile', label: 'Profile', icon: 'person', route: '/profile'),
          ];

    // Remove dashboard + profile from the FAB actions (they have dedicated buttons)
    final actions = destinations
        .where((d) => d.key != 'dashboard' && d.key != 'profile')
        .take(6)
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
          leading: IconButton(
            icon: const Icon(Icons.sync),
            tooltip: 'Sync',
            onPressed: () {
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
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: _goProfile,
                child: CircleAvatar(
                  radius: 18,
                  backgroundColor: theme.colorScheme.primary.withValues(alpha: 0.1),
                  child: Icon(Icons.person, size: 20, color: theme.colorScheme.primary),
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
            onTap: _close,
            child: widget.navigationShell,
          ),
          // Dimmed overlay when menu is open
          AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              final opacity = _controller.value * 0.4;
              if (opacity < 0.01) return const SizedBox.shrink();
              return GestureDetector(
                onTap: _close,
                child: Container(
                  color: Colors.black.withValues(alpha: opacity),
                ),
              );
            },
          ),
          // Radial FAB + action buttons
          _buildRadialFab(actions, theme),
        ],
      ),
    );
  }

  /// Build the radial FAB — main button + action buttons that fan out.
  /// Based on the taylanyildiz/FLUTTER-ANIMATION-FLOATING-ACTION-BUTTON pattern.
  Widget _buildRadialFab(List<NavDestination> actions, ThemeData theme) {
    // Spread action buttons in an arc from 180° to 270° (left to top)
    // Same angle spread as the reference repo
    final angleStep = actions.length > 1 ? 90.0 / (actions.length - 1) : 0;
    final startAngle = 180.0;

    return Positioned(
      bottom: 30,
      right: 30,
      child: SizedBox(
        width: 200,
        height: 200,
        child: Stack(
          alignment: Alignment.bottomRight,
          children: [
            // Action buttons (fan out in an arc)
            for (int i = 0; i < actions.length; i++)
              _buildActionButton(
                action: actions[i],
                angle: startAngle + (angleStep * i),
                theme: theme,
                index: i,
                total: actions.length,
              ),
            // Main FAB (rotates 360° on toggle)
            AnimatedBuilder(
              animation: _rotationAnimation,
              builder: (context, child) {
                return Transform(
                  transform: Matrix4.rotationZ(
                    _radiansFromDegrees(_rotationAnimation.value),
                  ),
                  alignment: Alignment.center,
                  child: child,
                );
              },
              child: GestureDetector(
                onTap: _toggle,
                child: Container(
                  padding: const EdgeInsets.all(18),
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
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(
                    _isOpen ? Icons.close : Icons.add,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Build a single action button that translates outward + scales in.
  /// Uses the same animation pattern as the reference repo:
  ///   - Transform.translate with Offset.fromDirection(angle, distance * animValue)
  ///   - Scale from 0 → 1.2 → 1.0 (overshoot)
  Widget _buildActionButton({
    required NavDestination action,
    required double angle,
    required ThemeData theme,
    required int index,
    required int total,
  }) {
    // Stagger each action button's animation slightly
    final staggerDelay = (index / total) * 0.3;
    final staggerEnd = staggerDelay + 0.7;

    final staggeredAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Interval(staggerDelay, staggerEnd.clamp(0.0, 1.0), curve: Curves.easeOut),
      ),
    );

    return AnimatedBuilder(
      animation: staggeredAnim,
      builder: (context, child) {
        final value = staggeredAnim.value;
        if (value < 0.01) return const SizedBox.shrink();

        return Transform.translate(
          offset: Offset.fromDirection(
            _radiansFromDegrees(angle),
            value * 90, // distance from center
          ),
          child: Transform(
            transform: Matrix4.identity()..scale(value),
            alignment: Alignment.center,
            child: child,
          ),
        );
      },
      child: GestureDetector(
        onTap: () => _navigateTo(action),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Label above the button
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(12),
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
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
              ),
            ),
            const SizedBox(height: 6),
            // Circular icon button
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.15),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(
                action.iconData,
                size: 22,
                color: theme.colorScheme.primary,
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
  'trainings': 13,
  'profile': 14,
};
