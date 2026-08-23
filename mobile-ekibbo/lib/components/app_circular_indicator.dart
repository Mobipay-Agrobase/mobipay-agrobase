import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';

class AppCircularIndicator extends StatelessWidget {
  const AppCircularIndicator({
    super.key,
    this.color,
  });
  final Color? color;
  @override
  Widget build(BuildContext context) {
    return Center(
      child: CircularProgressIndicator(
        color: color ?? ColorConstant.primary,
      ),
    );
  }
}
