import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/text_styles.dart';
import 'package:agrobase_ekibbo/components/useful_elements.dart';

class BaseAppBar extends StatelessWidget implements PreferredSizeWidget {
  const BaseAppBar({
    super.key,
    this.title,
    this.color,
    this.onTap,
    this.elevation,
    this.actions,
    this.automaticallyImplyLeading = true,
  });
  final String? title;
  final Color? color;
  final Function()? onTap;
  final List<Widget>? actions;
  final bool automaticallyImplyLeading;
  final double? elevation;
  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: color ?? Colors.white,
      automaticallyImplyLeading: automaticallyImplyLeading,
      centerTitle: false,
      leading: automaticallyImplyLeading
          ? Builder(
              builder: (context) => UsefulElements.backButton(
                context,
                onTap: onTap,
              ),
            )
          : null,
      title: title != null
          ? Text(
              title!,
              style: TextStyles.buildAppBarTexStyle(),
            )
          : null,
      elevation: elevation ?? 0.0,
      titleSpacing: !automaticallyImplyLeading ? 16 : 0,
      actions: actions,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
