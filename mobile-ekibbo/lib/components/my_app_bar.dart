import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';

class MyAppBar extends StatelessWidget implements PreferredSizeWidget {
  const MyAppBar({
    super.key,
    this.automaticallyImplyLeading = true,
    this.title,
  });
  final String? title;
  final bool automaticallyImplyLeading;
  @override
  Widget build(BuildContext context) {
    return AppBar(
      elevation: 0.8,
      backgroundColor: Colors.white,
      title: title != null
          ? Text(
              title!,
              style: const TextStyle(
                fontSize: 22,
                fontFamily: 'Roboto',
                color: Colors.black,
                fontWeight: FontWeight.w500,
              ),
            )
          : null,
      leading: automaticallyImplyLeading
          ? InkWell(
              onTap: () => Navigator.of(context).pop(),
              child: Center(child: SvgPicture.asset('ic_arrow_left'.iconSvg)),
            )
          : null,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
