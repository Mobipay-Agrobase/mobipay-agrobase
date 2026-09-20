// ignore_for_file: constant_identifier_names

import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/screens/dashboard/views/dashboard_screen.dart';
import 'package:mobipay_ekibbo/screens/farmer_registration/views/farmer_registration_screen.dart';
import 'package:mobipay_ekibbo/screens/login/views/login_screen.dart';

/// Global navigator key — used to access the navigator context from
/// non-widget code (e.g. AppLang.local looks it up via navigatorKey).
final GlobalKey<NavigatorState> navigatorKey = GlobalKey();

/// EKiBBO routes — simple onGenerateRoute router (no go_router dependency).
/// Add new screens here as they're built.
class RoutesManager {
  static Route<dynamic>? onGenerateRoute(RouteSettings settings) {
    Widget screen = const SizedBox.shrink();
    switch (settings.name) {
      case RouterName.login:
        screen = const LoginScreen();
        break;
      case RouterName.dashboard:
        screen = const DashboardScreen();
        break;
      case RouterName.farmerRegistration:
        screen = const FarmerRegistrationScreen();
        break;
    }
    return MaterialPageRoute(builder: (_) => screen);
  }
}

class RouterName {
  static const login = '/login';
  static const dashboard = '/dashboard';
  static const farmerRegistration = '/farmer_registration';
}
