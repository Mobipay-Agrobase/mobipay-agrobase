import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';

class SummaryItemVertical extends StatelessWidget {
  final String title;
  final String value;
  final Widget icon;

  /// Optional small line under the value — e.g. "of 1,979 in registry" on
  /// the My Farmers card so the officer-scoped count and the tenant-wide
  /// registry count are shown together (data-consistency fix).
  final String? subtitle;

  const SummaryItemVertical(
      {super.key,
      required this.title,
      required this.value,
      required this.icon,
      this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            offset: const Offset(4, 4),
            blurRadius: 15,
            color: Colors.black.withOpacity(0.15),
          )
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            Container(
              height: 48,
              width: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: ColorConstant.primary.withOpacity(0.1),
              ),
              child: Center(
                child: icon,
              ),
            ),
            const SizedBox(
              height: 16,
            ),
            Text(
              title,
              style: TextStyleConstant.robotoW500(
                fontSize: 14,
                color: ColorConstant.text79,
              ),
            ),
            const SizedBox(
              height: 4,
            ),
            Text(
              value,
              style: TextStyleConstant.robotoW600(
                fontSize: 22,
                color: ColorConstant.primary,
              ),
            ),
            if (subtitle != null && subtitle!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                subtitle!,
                textAlign: TextAlign.center,
                style: TextStyleConstant.robotoW400(
                  fontSize: 11,
                  color: ColorConstant.text79.withOpacity(0.7),
                ),
              ),
            ],
            //const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
