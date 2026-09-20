import 'package:flutter/material.dart';
import 'package:upstream/constant/text_style_constant.dart';
import 'package:upstream/routes/routes_manager.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Upstream',
      onGenerateRoute: RoutesManager.onGenerateRoute,
      initialRoute: RouterName.dashboard,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      navigatorKey: navigatorKey,
      theme: ThemeData(
        fontFamily: TextStyleConstant.workSans,
        useMaterial3: false,
      ),
    );
  }
}
