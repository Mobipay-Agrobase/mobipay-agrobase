import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/app_button.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';

/// EKiBBO shared EmptyState widget — used when a list has zero rows or
/// when a fetch returns no data.
///
/// Renders an icon in a soft brand-colored circle, a title, an optional
/// description, and an optional action button (e.g. "Add Farmer").
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    this.description,
    this.icon = Icons.inbox_outlined,
    this.actionTitle,
    this.onAction,
    this.color,
  });

  final String title;
  final String? description;
  final IconData icon;
  final String? actionTitle;
  final VoidCallback? onAction;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final accent = color ?? ColorConstant.primary;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: accent.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: accent, size: 40),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyleConstant.quicksandW700(
                fontSize: 16,
                color: ColorConstant.heading,
              ),
            ),
            if (description != null) ...[
              const SizedBox(height: 6),
              Text(
                description!,
                textAlign: TextAlign.center,
                style: TextStyleConstant.robotoW400(
                  fontSize: 13,
                  color: ColorConstant.textSecondary,
                ),
              ),
            ],
            if (actionTitle != null && onAction != null) ...[
              const SizedBox(height: 20),
              AppButton(
                title: actionTitle,
                height: 44,
                width: 200,
                color: accent,
                onTap: onAction,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
