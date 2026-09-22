// ignore_for_file: constant_identifier_names

import 'package:flutter/material.dart';
import 'package:upstream/screens/dashboard/views/dashboard_screen.dart';
import 'package:upstream/screens/farmer_registration/views/farmer_registration_screen.dart';
import 'package:upstream/screens/login/views/login_screen.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey();

class RoutesManager {
  static Route<dynamic>? onGenerateRoute(RouteSettings settings) {
    Widget screen = Container();
    switch (settings.name) {
      // case RouterName.splash:
      //   screen = SplashScreen();
      //   break;
      case RouterName.farmer_registration:
        screen = const FarmerRegistrationScreen();
        break;
      case RouterName.login:
        screen = const LoginScreen();
        break;
      case RouterName.dashboard:
        screen = const DashboardScreen();
        break;
    }
    return MaterialPageRoute(builder: (_) => screen);
  }
}

class RouterName {
  static const farmer_registration = '/farmer_registration';
  static const login = '/login';
  static const dashboard = '/dashboard';
}
