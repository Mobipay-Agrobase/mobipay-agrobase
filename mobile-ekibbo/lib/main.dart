import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
//import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:provider/provider.dart';
//import 'package:shorebird_code_push/shorebird_code_push.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
//import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/ota_cache_service.dart';
import 'package:agrobase_ekibbo/infrastructure/sync/sync_engine.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/domain/l10n/generated/app_localizations.dart';

//final shorebirdCodePush = ShorebirdCodePush();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = MyHttpOverrides();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  //configLoading();
  await ApiProvider.instance.initialize();
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  void initState() {
    super.initState();
    // shorebirdCodePush
    //     .currentPatchNumber()
    //     .then((value) => debugPrint('current patch number is $value'));
    // OTA data cache + offline auto-sync engine (connectivity watch).
    OtaCacheService.instance.init();
    SyncEngine.instance.init();
  }

  // Future<void> _checkForUpdates() async {
  //   final isUpdateAvailable =
  //       await shorebirdCodePush.isNewPatchAvailableForDownload();
  //   if (isUpdateAvailable) {
  //     await shorebirdCodePush.downloadUpdateIfAvailable();
  //   }
  // }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppProvider()),
      ],
      child: MaterialApp(
        title: 'Mobipay-Agrobase',
        //builder: EasyLoading.init(),
        onGenerateRoute: RoutesManager.onGenerateRoute,
        initialRoute: RouterName.splash,
        navigatorKey: NavigatorManager.navigatorKey,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        debugShowCheckedModeBanner: false,
        supportedLocales: AppLocalizations.supportedLocales,
        locale: Locale(SharedPreferencesProvider.instance.appLang),
        theme: ThemeData(
          fontFamily: TextStyleConstant.workSans,
          useMaterial3: false,
        ),
      ),
    );
  }
}

// void configLoading() {
//   EasyLoading.instance
//     ..displayDuration = const Duration(milliseconds: 2000)
//     ..indicatorType = EasyLoadingIndicatorType.ring
//     ..loadingStyle = EasyLoadingStyle.custom
//     ..indicatorSize = 45.0
//     ..radius = 10.0
//     ..progressColor = Colors.yellow
//     ..backgroundColor = Colors.white
//     ..indicatorColor = ColorConstant.primary
//     ..textColor = Colors.yellow
//     ..userInteractions = false
//     ..maskColor = Colors.blue.withOpacity(0.5)
//     ..dismissOnTap = false;
// }

class MyHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..badCertificateCallback =
          (X509Certificate cert, String host, int port) => true;
  }
}
