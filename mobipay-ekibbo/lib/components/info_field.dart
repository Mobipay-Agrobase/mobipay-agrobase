import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';

/// EKiBBO shared InfoField — a label + value row used on detail screens.
///
/// Renders a small uppercase label on top and a value underneath. Designed to
/// compose nicely inside a `Column` or `Wrap` for tabbed detail screens
/// (Farmer detail, Farm Land detail, etc.).
class InfoField extends StatelessWidget {
  const InfoField({
    super.key,
    required this.label,
    this.value,
    this.icon,
    this.crossAxisAlignment = CrossAxisAlignment.start,
    this.valueMaxLines = 2,
  });

  final String label;
  final String? value;
  final IconData? icon;
  final CrossAxisAlignment crossAxisAlignment;
  final int valueMaxLines;

  @override
  Widget build(BuildContext context) {
    final v = (value == null || value!.trim().isEmpty) ? '—' : value;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: crossAxisAlignment,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: ColorConstant.textSecondary),
            const SizedBox(width: 6),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: crossAxisAlignment,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label.toUpperCase(),
                  style: TextStyleConstant.robotoW500(
                    fontSize: 10,
                    color: ColorConstant.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  v!,
                  maxLines: valueMaxLines,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyleConstant.robotoW500(
                    fontSize: 13,
                    color: ColorConstant.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
