import 'dart:math' as math;
import 'package:flutter/material.dart';

/// SpeedDialFab — a vertical speed-dial FAB with pill labels.
///
/// Based on the "Hawk Fab Menu" design:
///   - Main FAB button (bottom-right, circular, colored)
///   - Tapping opens menu items stacked vertically upward
///   - Each item: circular icon button + pill label to its left
///   - Staggered slide-up + fade-in animation
///   - Tapping an item → calls onTap + closes menu
///   - Tapping outside → closes menu
///   - Main FAB icon rotates 180° when toggling
class SpeedDialFab extends StatefulWidget {
  /// The main FAB icon (when closed). Usually Icons.add.
  final IconData mainIcon;

  /// The main FAB color.
  final Color mainColor;

  /// List of speed-dial actions.
  final List<SpeedDialAction> actions;

  /// Callback when the FAB is toggled (optional).
  final VoidCallback? onToggle;

  const SpeedDialFab({
    super.key,
    required this.mainIcon,
    required this.mainColor,
    required this.actions,
    this.onToggle,
  });

  @override
  State<SpeedDialFab> createState() => _SpeedDialFabState();
}

class _SpeedDialFabState extends State<SpeedDialFab>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _rotation;
  late Animation<double> _overlayOpacity;
  bool _isOpen = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _rotation = Tween<double>(begin: 0, end: 0.5).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    _overlayOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggle() {
    if (_isOpen) {
      _controller.reverse();
    } else {
      _controller.forward();
    }
    setState(() => _isOpen = !_isOpen);
    widget.onToggle?.call();
  }

  void _close() {
    if (_isOpen) {
      _controller.reverse();
      setState(() => _isOpen = false);
    }
  }

  void _onActionTap(SpeedDialAction action) {
    _close();
    action.onTap();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.bottomRight,
      children: [
        // Dimmed overlay (captures taps to close)
        if (_isOpen)
          AnimatedBuilder(
            animation: _overlayOpacity,
            builder: (context, _) {
              final opacity = (_overlayOpacity.value * 0.5).clamp(0.0, 1.0);
              if (opacity < 0.01) return const SizedBox.shrink();
              return GestureDetector(
                onTap: _close,
                child: Container(
                  color: Colors.black.withValues(alpha: opacity),
                ),
              );
            },
          ),
        // Speed-dial items (stacked vertically upward)
        if (_isOpen)
          Positioned(
            bottom: 72, // above the main FAB
            right: 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisSize: MainAxisSize.min,
              children: widget.actions.asMap().entries.map((entry) {
                final index = entry.key;
                final action = entry.value;
                // Stagger: each item starts 60ms after the previous
                final delay = index * 0.15;
                final end = (delay + 0.5).clamp(0.0, 1.0);
                final itemAnim = Tween<double>(begin: 0, end: 1).animate(
                  CurvedAnimation(
                    parent: _controller,
                    curve: Interval(delay, end, curve: Curves.easeOut),
                  ),
                );
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _SpeedDialItem(
                    action: action,
                    animation: itemAnim,
                    onTap: () => _onActionTap(action),
                  ),
                );
              }).toList(),
            ),
          ),
        // Main FAB button
        AnimatedBuilder(
          animation: _rotation,
          builder: (context, child) {
            return Transform(
              alignment: Alignment.center,
              transform: Matrix4.rotationZ(_rotation.value * math.pi),
              child: child,
            );
          },
          child: GestureDetector(
            onTap: _toggle,
            child: Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: widget.mainColor,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: widget.mainColor.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Icon(
                _isOpen ? Icons.close : widget.mainIcon,
                color: Colors.white,
                size: 28,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// A single speed-dial item: circular icon button + pill label.
class _SpeedDialItem extends StatelessWidget {
  final SpeedDialAction action;
  final Animation<double> animation;
  final VoidCallback onTap;

  const _SpeedDialItem({
    required this.action,
    required this.animation,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        final value = animation.value;
        if (value < 0.01) return const SizedBox.shrink();
        return Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, 30 * (1 - value)),
            child: child,
          ),
        );
      },
      child: GestureDetector(
        onTap: onTap,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Pill label
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: Text(
                action.label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: action.labelColor ?? Colors.black87,
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Circular icon button
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: action.backgroundColor,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.15),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(
                action.icon,
                color: action.iconColor ?? Colors.white,
                size: 22,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Configuration for a single speed-dial action.
class SpeedDialAction {
  final IconData icon;
  final String label;
  final Color backgroundColor;
  final Color? iconColor;
  final Color? labelColor;
  final VoidCallback onTap;

  const SpeedDialAction({
    required this.icon,
    required this.label,
    required this.backgroundColor,
    required this.onTap,
    this.iconColor,
    this.labelColor,
  });
}
