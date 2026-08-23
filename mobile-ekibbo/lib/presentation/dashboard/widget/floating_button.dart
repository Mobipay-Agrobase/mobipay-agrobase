import 'package:flutter/material.dart';
import 'package:flutter_speed_dial/flutter_speed_dial.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/roles/floating_config.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';

class DashboardFloatingButton extends StatefulWidget {
  const DashboardFloatingButton({super.key});

  @override
  State<DashboardFloatingButton> createState() =>
      _DashboardFloatingButtonState();
}

class _DashboardFloatingButtonState extends State<DashboardFloatingButton> {
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return SpeedDial(
      activeChild: SvgPicture.asset('ic_close2'.iconSvg),
      activeIcon: Icons.close,
      backgroundColor: ColorConstant.primary,
      foregroundColor: Colors.white,
      activeBackgroundColor: ColorConstant.primary,
      activeForegroundColor: Colors.white,
      buttonSize: const Size(48, 48),
      visible: true,
      spaceBetweenChildren: 12,
      spacing: 0,
      childMargin: const EdgeInsets.all(0),
      closeManually: false,
      curve: Curves.linear,
      overlayColor: Colors.black,
      overlayOpacity: 0.8,
      elevation: 0.0, //shadow elevation of button
      shape: const CircleBorder(), //shape of button
      childPadding: const EdgeInsets.only(left: 0),
      childrenButtonSize: const Size(48, 48),
      children: floatingConfigs
          .where((e) => e.roleAccessed
              .contains(SharedPreferencesProvider.instance.userInfo!.roleUser))
          .toList()
          .map((e) => _buildChildButton(
              icon: e.icon, title: e.title, routeName: e.routeName))
          .toList(),
      child: Center(child: SvgPicture.asset('ic_plus'.iconSvg)),
    );
  }

  SpeedDialChild _buildChildButton(
      {required String icon,
      required String title,
      required String routeName}) {
    return SpeedDialChild(
      child: SvgPicture.asset(
        icon.iconSvg,
        color: Colors.white,
        width: 20,
        height: 20,
      ),
      backgroundColor: Colors.transparent,
      foregroundColor: Colors.transparent,
      elevation: 0,
      labelWidget: Text(
        title,
        style: TextStyleConstant.robotoW500(
          color: Colors.white,
        ),
      ),
      onTap: () =>
          Navigator.of(NavigatorManager.contextRoot).pushNamed(routeName),
    );
  }
}
