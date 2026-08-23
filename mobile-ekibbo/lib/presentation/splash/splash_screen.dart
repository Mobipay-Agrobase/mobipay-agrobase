import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initScreen();
  }

  _initScreen() {
    Future.delayed(
      const Duration(seconds: 1),
      () {
        if (SharedPreferencesProvider.instance.accessToken.isEmpty) {
          return Navigator.of(context)
              .pushNamedAndRemoveUntil(RouterName.login, (route) => false);
        }
        if (SharedPreferencesProvider.instance.userInfo == null) {
          return Navigator.of(context)
              .pushNamedAndRemoveUntil(RouterName.login, (route) => false);
        }
        return Navigator.of(context)
            .pushNamedAndRemoveUntil(RouterName.dashboard, (route) => false);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            child: GImage.asset(
              name: 'bg_splash'.imgPNG,
            ),
          ),
          Positioned(
            top: MediaQuery.of(context).size.height / 5,
            left: 0,
            right: 0,
            child: Column(
              children: [
                GImage.asset(
                  name: 'icon'.imgPNG,
                  width: 146,
                  height: 146,
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
