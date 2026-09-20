import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:mobipay_ekibbo/components/g_image.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';

/// EKiBBO AppBar — uses the primary brand color (coffee brown) + white text.
/// Override the global theme locally if you need a different style.
class MyAppBar extends StatelessWidget implements PreferredSizeWidget {
  const MyAppBar({
    super.key,
    this.automaticallyImplyLeading = true,
    this.title,
    this.backgroundColor,
    this.foregroundColor,
    this.actions,
  });
  final String? title;
  final bool automaticallyImplyLeading;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context) {
    return AppBar(
      elevation: 0.4,
      backgroundColor: backgroundColor ?? ColorConstant.primary,
      foregroundColor: foregroundColor ?? Colors.white,
      title: title != null
          ? Text(
              title!,
              style: const TextStyle(
                fontSize: 18,
                fontFamily: 'Quicksand',
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            )
          : null,
      leading: automaticallyImplyLeading
          ? IconButton(
              icon: SvgPicture.asset(
                'ic_arrow_left'.iconSvg,
                color: Colors.white,
              ),
              onPressed: () => Navigator.of(context).pop(),
            )
          : null,
      actions: actions,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
