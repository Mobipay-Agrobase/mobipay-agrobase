import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';

class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  const CustomAppBar({
    super.key,
    this.title,
    this.color,
    this.onTap,
    this.elevation,
    this.actions,
    this.automaticallyImplyLeading = true,
    this.titleColor,
    this.backColor,
    this.subTitle,
    this.bottom,
    this.size = kToolbarHeight,
  });
  final String? title;
  final Color? color;
  final Function()? onTap;
  final List<Widget>? actions;
  final bool automaticallyImplyLeading;
  final double? elevation;
  final Color? titleColor;
  final Color? backColor;
  final Widget? subTitle;
  final PreferredSizeWidget? bottom;
  final double size;
  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: color ?? Colors.white,
      automaticallyImplyLeading: automaticallyImplyLeading,
      centerTitle: false,
      leading: automaticallyImplyLeading
          ? InkWell(
              onTap: Navigator.of(context).pop,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: SvgPicture.asset(
                  'ic_back'.iconSvg,
                  color: backColor ?? Colors.black,
                ),
              ),
            )
          : null,
      title: title != null
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title!,
                  style: TextStyleConstant.quicksandW600(
                    fontSize: 16,
                    color: titleColor ?? Colors.black,
                  ),
                ),
                if (subTitle != null) subTitle!
              ],
            )
          : null,
      elevation: elevation ?? 0.0,
      titleSpacing: !automaticallyImplyLeading ? 16 : 0,
      actions: actions,
      bottom: bottom,
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(size);
}
