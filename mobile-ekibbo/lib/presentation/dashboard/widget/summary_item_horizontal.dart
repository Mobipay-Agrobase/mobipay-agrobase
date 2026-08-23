import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';

class SummaryItemHorizontal extends StatelessWidget {
  final String title;
  final String value;

  const SummaryItemHorizontal(
      {super.key, required this.title, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
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
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
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
            )
          ],
        ),
      ),
    );
  }
}
