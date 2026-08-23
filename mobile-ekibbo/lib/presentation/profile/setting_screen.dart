import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_logs.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_address.dart';
//import 'package:agrobase_ekibbo/routes/routes_manager.dart';

class ScreenSettings extends StatefulWidget {
  const ScreenSettings({super.key});

  @override
  State<ScreenSettings> createState() => _ScreenSettingsState();
}

class _ScreenSettingsState extends State<ScreenSettings> {
  loadDataToLocal() async {
    try {
      DialogHelper.showLoading();
      await ApiAddress.getCountries();
      await ApiAddress.getAllProvinces();
      await ApiAddress.getAllDistricts();
      await ApiAddress.getAllCommunes();
      await ApiAddress.getCooperatives();
      await ApiAddress.getDropDownForRegister();
      await ApiAddress.getDropDownForFarmland();
      await ApiAddress.getDropdownCropData();
      DialogHelper.hideLoading();
      DialogHelper.showToastSuccess(context);
    } catch (e) {
      DialogHelper.hideLoading();
      DialogHelper.showOkDialog(context, 'Error loading data: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.settings,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          children: [
            _buildSettingSwitchBtn(
              AppLang.local.app_language,
              SizedBox(
                width: 130,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Text('en', style: TextStyleConstant.quicksandW400()),
                    Switch(
                      activeColor: ColorConstant.primary,
                      onChanged: (bool value) async {
                        DialogHelper.showLoading();
                        await context.read<AppProvider>().updateStateFuture(
                            AppEvent.appSettingSwitchLanguage);
                        DialogHelper.hideLoading();
                      },
                      value: context.watch<AppProvider>().appSettings.isVi,
                    ),
                    Text('vi ', style: TextStyleConstant.quicksandW400()),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            //cache data for offline
            _buildSettingSwitchBtn(
              AppLang.local.sync_data,
              TextButton(
                onPressed: () {
                  loadDataToLocal();
                },
                child: Text(
                  AppLang.local.sync_data,
                  style: TextStyleConstant.quicksandW400(color: Colors.blue),
                ),
              ),
            ),
            // _buildSettingSwitchBtn(
            //   "Mode",
            //   SizedBox(
            //     width: 130,
            //     child: Row(
            //       mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            //       children: [
            //         Text('dev', style: TextStyleConstant.quicksandW400()),
            //         Switch(
            //           activeColor: ColorConstant.primary,
            //           onChanged: (bool value) {
            //             DialogHelper.showOkDialog(context,
            //                 'Are you sure you want to switch to ${value ? 'pro' : 'dev'} mode?',
            //                 okAction: () {
            //               context
            //                   .read<AppProvider>()
            //                   .updateState(AppEvent.appSettingSwitchMode);
            //               Navigator.of(context).pushNamedAndRemoveUntil(
            //                   RouterName.login, (route) => false);
            //             });
            //           },
            //           value: context.watch<AppProvider>().appSettings.isPro,
            //         ),
            //         Text('pro', style: TextStyleConstant.quicksandW400()),
            //       ],
            //     ),
            //   ),
            // ),
          ],
        ),
      ),
    );
  }

  _buildSettingSwitchBtn(String title, Widget child) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        InkWell(
          onLongPress: () {
            showDialogLogs();
          },
          child: Text(
            title,
            style: TextStyleConstant.quicksandW600(),
          ),
        ),
        child,
      ],
    );
  }
}
