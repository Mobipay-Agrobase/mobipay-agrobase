import 'package:flutter/material.dart';
import 'package:upstream/constant/color_constant.dart';
import 'package:upstream/constant/text_style_constant.dart';

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    this.height,
    this.width,
    this.title,
    this.color,
    this.onTap,
    this.hideBorder = false,
    this.radius,
    this.isLoading = false,
    this.titleStyle,
    this.borderColor,
    this.disable = false,
  });
  final double? height;
  final double? width;
  final Color? color;
  final String? title;
  final Function()? onTap;
  final bool hideBorder;
  final double? radius;
  final TextStyle? titleStyle;
  final bool isLoading;
  final Color? borderColor;
  final bool disable;
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: isLoading || disable ? null : onTap,
      child: Container(
        height: height,
        width: width,
        decoration: BoxDecoration(
          color: (color ?? ColorConstant.primary),
          borderRadius: BorderRadius.all(
            Radius.circular(radius ?? 12.0),
          ),
        ),
        child: Center(
          child: isLoading
              ? const CircularProgressIndicator(
                  color: Colors.white,
                )
              : Text(
                  title ?? '',
                  style: titleStyle ??
                      TextStyleConstant.worksansW500(
                        fontSize: 16,
                        color: Colors.white,
                      ),
                ),
        ),
      ),
    );
  }
}
