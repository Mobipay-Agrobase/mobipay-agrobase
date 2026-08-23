// ignore_for_file: use_build_context_synchronously

import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_orther_info.dart';
import 'package:agrobase_ekibbo/models/dashboard/dashboard_model.dart';
import 'package:agrobase_ekibbo/models/dashboard/dashboard_model_famer.dart';
import 'package:agrobase_ekibbo/models/srp/srp_schedule_response.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';
import 'package:agrobase_ekibbo/models/weather/weather_current.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

class ApiDashboard {
  static Future<DashboardModel?> getDashboardData() async {
    try {
      final res = await ApiProvider.instance.apiDashboard
          .getDashboardData(DataConstant.lat, DataConstant.lng, 50);
      if (res == null) {
        throw const FormatException('getDashboardData response null');
      }
      if (res.data == null) {
        throw const FormatException('getDashboardData data null');
      }
      return res.data;
    } on SocketException {
      DialogHelper.showToast(
          NavigatorManager.contextRoot, 'No connect internet!');
      return null;
    } catch (e) {
      // Defensive: never let a parse/API error escape — the old code blindly
      // cast to DioException and crashed, leaving an EMPTY dashboard.
      if (e is DioException) {
        final code = e.response?.statusCode;
        if (code == 401 || code == 403) {
          DialogHelper.showOkDialog(
              NavigatorManager.contextRoot, "Login Session Expired",
              okAction: () {
            SharedPreferencesProvider.instance.clear();
            NavigatorManager.replacementAndRemoveUntil(RouterName.login);
          });
        }
      }
      debugPrint("getDashboardData $e");
      return null;
    }
  }

  static Future<MDashboardFarmer?> getDashboardFarmer() async {
    try {
      final res = await ApiProvider.instance.apiDashboard
          .getDashboardFarmer(DataConstant.lat, DataConstant.lng, 50);
      if (res == null) {
        throw const FormatException('getDashboardFarmer response null');
      }
      if (res.data == null) {
        throw const FormatException('getDashboardFarmer data null');
      }
      if (res.result == true) {
        return res.data;
      } else {
        throw Exception("Please login again!");
      }
    } on SocketException {
      DialogHelper.showToast(
          NavigatorManager.contextRoot, 'No connect internet!');
      return null;
    } catch (e) {
      if ((e as DioException).response!.statusCode == 200) {
        DialogHelper.showOkDialog(
            NavigatorManager.contextRoot, "Login Session Exprired",
            okAction: () {
          SharedPreferencesProvider.instance.clear();
          NavigatorManager.replacementAndRemoveUntil(RouterName.login);
        });
      }
      debugPrint("getDashboardData $e");
      return null;
    }
  }

  static Future<List<SRPActionModel>> getTodayTask() async {
    try {
      final startDay = DateTime.now();
      final res = await ApiProvider.instance.apiSRP
          .getSRPDate(DateHelper.convertDateToStr(startDay));
      if (res == null) {
        throw const FormatException('getTodayTask response null');
      }
      if (res.data == null) {
        throw const FormatException('getTodayTask data null');
      }
      return res.data!;
    } catch (e) {
      debugPrint(e.toString());
      return [];
    }
  }

  static Future<MWeather?> getTodayWeather() async {
    try {
      if (DOrtherInfo.instance.weather == null) {
        final res = await ApiProvider.instance.apiWeather.getTodayWeather();
        DOrtherInfo.instance.weather = res;
      }
      return DOrtherInfo.instance.weather;
    } catch (e) {
      debugPrint(e.toString());
      return null;
    }
  }
}
