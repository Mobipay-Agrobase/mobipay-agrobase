import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
import 'package:agrobase_ekibbo/components/common.dart';
import 'package:agrobase_ekibbo/domain/roles/role_config.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_orther_info.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/user_info.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/drawer_view.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/floating_button.dart';
import 'package:agrobase_ekibbo/presentation/login/model/user_role.dart';

import 'dashboard/dashboard_farmer.dart';
import 'dashboard/dashboard_market_farmer.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  /// Unique per-instance Scaffold key — registered on NavigatorManager so
  /// the app-bar drawer button opens THIS screen's drawer. A shared static
  /// key caused 'Duplicate GlobalKey in widget tree' when two dashboard
  /// routes existed briefly (session-restore + login navigation).
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    NavigatorManager.scaffoldKey = _scaffoldKey;
    DOrtherInfo.instance.requestLocation();
    context.read<AppProvider>().initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      key: _scaffoldKey,
      drawer: const DrawerView(),
      floatingActionButton:
          isShowFloatButton() ? const DashboardFloatingButton() : null,
      body: Stack(
        children: [
          Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: WidgetCommon.buildBGDashboard()),
          Positioned(child: _buildBoardRole())
        ],
      ),
    );
  }

  _buildBoardRole() {
    if (DUserInfo.instance.user == null) return Container();
    switch (DUserInfo.instance.user!.roleUser) {
      case EnumUserRole.farmer:
        return const DashboardFarmer();
      default:
        return const DashboardMarketFarmer();
    }
  }
}
