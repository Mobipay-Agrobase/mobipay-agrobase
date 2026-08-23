import 'dart:convert';

//import 'package:app_settings/app_settings.dart';
import 'package:flutter/services.dart';
import 'package:maps_toolkit/maps_toolkit.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_open_setting.dart';
import 'package:agrobase_ekibbo/components/helpers/location_helper.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/domain/l10n/model/app_language.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';
import 'package:agrobase_ekibbo/models/weather/weather_current.dart';

class DOrtherInfo {
  DOrtherInfo._privateConstructor();
  static final DOrtherInfo instance = DOrtherInfo._privateConstructor();

  LatLng? location;
  MWeather? weather;

  setLatLng(double latitude, double longitude) {
    if (latitude == 0) return;
    location = LatLng(latitude, longitude);
  }

  Future<bool> requestLocation() async {
    final locationData = await LocationHelper.requestLocation();
    location = null;
    if (locationData == null) {
      return false;
    }
    //print("requestLocation ${locationData.latitude} - ${locationData.longitude}");
    setLatLng(locationData.latitude ?? 0, locationData.longitude ?? 0);
    DataConstant.lat = location!.latitude;
    DataConstant.lng = location!.longitude;
    ApiProvider.instance
        .captureLocation(location!.latitude, location!.longitude);
    return true;
  }

  Future<bool> isAcceptLocation() async {
    DialogHelper.showLoading();
    await requestLocation();
    DialogHelper.hideLoading();
    if (location == null) {
      // ignore: use_build_context_synchronously
      await showDialogSetting(() async {
        //await AppSettings.openAppSettings(type: AppSettingsType.location);
      });
    }
    return location != null;
  }

  Future<MAppLang> setAppLang(String lang) async {
    switch (lang) {
      case 'en':
        final data = await _readFile('assets/lang/app_en.json');
        return MAppLang.fromJson(data);
      default:
        final data = await _readFile('assets/lang/app_vi.json');
        return MAppLang.fromJson(data);
    }
  }

  Future<Map<String, dynamic>> _readFile(String fileName) async {
    final res = await rootBundle.loadString(fileName);
    final data = Map<String, dynamic>.from(jsonDecode(res));
    return data;
  }
}
