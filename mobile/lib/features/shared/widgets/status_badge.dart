import 'package:flutter/material.dart';
import '../../../../core/utils/constants.dart';

class StatusBadge extends StatelessWidget {
  final String? status;
  final String? label;  // optional override for display text
  final Color? color;   // optional override for text color

  const StatusBadge({super.key, this.status, this.label, this.color});

  String _formatStatus(String s) {
    // Convert snake_case or camelCase to Title Case
    final formatted = s.replaceAll('_', ' ').replaceAllMapped(
      RegExp(r'[A-Z]'),
      (match) => ' ${match.group(0)}',
    );
    return formatted.trim().split(' ').map((word) {
      if (word.isEmpty) return '';
      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    }).join(' ');
  }

  @override
  Widget build(BuildContext context) {
    final effectiveStatus = status ?? label ?? '';
    final lowerStatus = effectiveStatus.toLowerCase();
    final textColor = color ?? AppConstants.statusColors[lowerStatus] ??
        const Color(0xFF64748B);
    final bgColor = AppConstants.statusBackgroundColors[lowerStatus] ??
        const Color(0xFFF1F5F9);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label ?? _formatStatus(effectiveStatus),
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}