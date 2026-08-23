import 'package:flutter/material.dart';

class NavigatorManager {
  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();
  static final GlobalKey<ScaffoldMessengerState> scaffoldMessengerKey =
      GlobalKey<ScaffoldMessengerState>();
  /// Mutable: each DashboardScreen instance registers its OWN unique key
  /// here (fixes 'Duplicate GlobalKey' when two dashboard routes coexist
  /// briefly during session-restore + login navigation).
  static GlobalKey<ScaffoldState> scaffoldKey =
      GlobalKey<ScaffoldState>();

  static NavigatorState get stateRoot => navigatorKey.currentState!;
  static BuildContext get contextRoot => navigatorKey.currentContext!;
  static Size get size => MediaQuery.of(contextRoot).size;
  static TextTheme get textTheme => Theme.of(contextRoot).textTheme;

  static Future<dynamic> push(Widget component,
      {Object? arguments, String? name}) {
    return navigatorKey.currentState!.push(
      MaterialPageRoute(
        builder: (_) => component,
        settings: RouteSettings(arguments: arguments, name: name),
      ),
    );
  }

  static Future<dynamic> replacementAndRemoveUntil(String routeName,
      {Object? arguments}) {
    return navigatorKey.currentState!.pushNamedAndRemoveUntil(
        routeName, (route) => false,
        arguments: arguments);
  }

  static void pop() {
    navigatorKey.currentState!.pop();
  }
}
