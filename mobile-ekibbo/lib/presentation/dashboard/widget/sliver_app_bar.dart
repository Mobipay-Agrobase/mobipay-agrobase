import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/presentation/notifications/screen_notification.dart';

class DashboardAppBar extends StatelessWidget {
  const DashboardAppBar({super.key});

  @override
  Widget build(BuildContext context) {
    return SliverAppBar(
      backgroundColor: ColorConstant.primary,
      title: Text(
        AppLang.local.dashboard,
        style: TextStyleConstant.quicksandW600(
          fontSize: 16,
          color: Colors.white,
        ),
      ),
      centerTitle: false,
      floating: true,
      titleSpacing: 0,
      leading: InkWell(
        onTap: () => NavigatorManager.scaffoldKey.currentState!.openDrawer(),
        child: Container(
          padding: const EdgeInsets.all(16),
          child: SvgPicture.asset(
            'ic_drawer'.iconSvg,
          ),
        ),
      ),
      actions: [
        InkWell(
          onTap: () =>
              Navigator.of(context).pushNamed(RouterName.sync_from_local),
          child: SvgPicture.asset(
            'ic_sync'.iconSvg,
          ),
        ),
        const SizedBox(
          width: 16,
        ),
        InkWell(
          onTap: () {
            Navigator.of(context).push(MaterialPageRoute(
                builder: (context) => ScreenNotification()));
          },
          child: SvgPicture.asset(
            'ic_bell'.iconSvg,
          ),
        ),
        const SizedBox(
          width: 16,
        ),
        Container(
          height: 24,
          width: 24,
          margin: const EdgeInsets.only(right: 16),
          clipBehavior: Clip.hardEdge,
          decoration: BoxDecoration(
            border: Border.all(color: Colors.white),
            shape: BoxShape.circle,
          ),
          child: const GInternetImage(
            url:
                'https://otbsalessolutions.com/wp-content/uploads/2021/08/Farmer-standing-in-field.jpg',
            fit: BoxFit.fill,
          ),
        ),
      ],
    );
  }
}
