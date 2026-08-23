import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';

class LanguageScreen extends StatelessWidget {
  const LanguageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.app_language,
      ),
      body: Column(
        children: [
          Center(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('en', style: TextStyleConstant.quicksandW400()),
                Switch(
                  activeColor: ColorConstant.primary,
                  onChanged: (bool value) {
                    context.read<AppProvider>().appSettings.switchLanguage();
                  },
                  value: context.watch<AppProvider>().appSettings.isVi,
                ),
                Text('vi', style: TextStyleConstant.quicksandW400()),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
