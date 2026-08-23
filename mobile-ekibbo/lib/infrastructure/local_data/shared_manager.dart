import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:agrobase_ekibbo/domain/core/extension/extention.dart';
import 'package:agrobase_ekibbo/domain/l10n/model/app_language.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_orther_info.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/user_info.dart';
import 'package:agrobase_ekibbo/models/farmer_local/farmer_local_model.dart';
import 'package:agrobase_ekibbo/models/user/user_model.dart';

enum SharedKey {
  accessToken,
  sellerToken,
  userName,
  userInfo,
  applang,
  appMode,
}

enum EAppLang {
  en,
  vi,
}

enum EAppMode {
  dev,
  pro,
}

class SharedPreferencesProvider {
  SharedPreferencesProvider._privateConstructor();
  static final SharedPreferencesProvider instance =
      SharedPreferencesProvider._privateConstructor();

  late SharedPreferences _shared;
  late String accessToken;
  late String sellerToken;
  late String appLang;
  late String appMode;
  bool isEnvPro = true;
  bool isInstance = false;
  UserModel? userInfo;
  List<MFarmerLocal> farmerLocal = [];
  late MAppLang localLang;

  Future init() async {
    _shared = await SharedPreferences.getInstance();
    isInstance = true;
    _fetchUserInfo();
    _fetchFarmerLocal();
    accessToken = _getString(SharedKey.accessToken.name) ?? '';
    sellerToken = _getString(SharedKey.sellerToken.name) ?? '';
    appLang = _getString(SharedKey.applang.name) ?? EAppLang.en.name;
    appMode = _getString(SharedKey.appMode.name) ?? EAppMode.pro.name;
    isEnvPro = appMode == EAppMode.pro.name ? true : false;
    localLang = await DOrtherInfo.instance.setAppLang(appLang);
    debugPrint("Access_token => $accessToken");
    debugPrint("UserInfo ${userInfo?.toJson}");
  }

  setAppLang(String value) async {
    appLang = value;
    _setString(SharedKey.applang.name, value);
  }

  setAppMode(String value) {
    appMode = value;
    isEnvPro = appMode == EAppMode.pro.name ? true : false;
    _setString(SharedKey.appMode.name, value);
  }

  setAccessToken(String value) {
    accessToken = value;
    _setString(SharedKey.accessToken.name, value);
  }

  setSellerToken(String value) {
    sellerToken = value;
    _setString(SharedKey.sellerToken.name, value);
  }

  setUserInfo(UserModel value) {
    userInfo = value;
    DUserInfo.instance.user = userInfo;
    _setString(SharedKey.userInfo.name, jsonEncode(value.toJson));
  }

  _fetchUserInfo() {
    try {
      final userInfoString = _getString(SharedKey.userInfo.name);
      if (userInfoString == null) return;
      userInfo = UserModel.fromJson(jsonDecode(userInfoString));
      DUserInfo.instance.user = userInfo;
    } catch (e) {
      debugPrint('error fetchUserInfo: $e');
    }
  }

  _fetchFarmerLocal() {
    try {
      if (userInfo == null) return;
      final farmers = _getList(userInfo!.id.toString());
      if (farmers.isEmpty) return;
      for (var element in farmers) {
        element.printWrapped();
        farmerLocal.add(MFarmerLocal.fromJson(element));
      }
    } catch (e) {
      debugPrint('error fetchFarmerLocal: $e');
    }
  }

  _isFarmerExist(int idFarmer) {
    return farmerLocal
        .where((element) => element.id == idFarmer)
        .toList()
        .isNotEmpty;
  }

  _saveToLocal() {
    final datas = farmerLocal.map((e) => e.toJson()).toList();
    _setList(userInfo!.id.toString(), datas);
  }

  saveFarmerDataToLocal(MFarmerLocal mFarmerLocal) {
    try {
      if (_isFarmerExist(mFarmerLocal.id)) {
        farmerLocal.removeWhere((element) => element.id == mFarmerLocal.id);
      }
      farmerLocal.insert(0, mFarmerLocal);
      _saveToLocal();
    } catch (e) {
      debugPrint("error saveFarmerDataToLocal: $e");
    }
  }

  deleteFarmerDataToLocal(int farmerId) {
    try {
      if (!_isFarmerExist(farmerId)) return;
      farmerLocal.removeWhere((element) => element.id == farmerId);
      _saveToLocal();
    } catch (e) {
      debugPrint("error deleteFarmerDataToLocal: $e");
    }
  }

  _setString(String key, String value) {
    _shared.setString(key, value);
  }

  String? _getString(String key) {
    return _shared.getString(key);
  }

  _setList(String key, List<String> values) {
    _shared.setStringList(key, values);
  }

  List<String> _getList(String key) {
    return _shared.getStringList(key) ?? [];
  }

  clearKey(String key) {
    _shared.remove(key);
  }

  clear() {
    userInfo = null;
    setAccessToken('');
    DUserInfo.instance.user = null;
    clearKey(SharedKey.sellerToken.name);
    clearKey(SharedKey.userInfo.name);
    clearKey(SharedKey.userName.name);
  }

  switchMode() {
    userInfo = null;
    setAccessToken('');
    setAppMode(isEnvPro ? EAppMode.dev.name : EAppMode.pro.name);
    DUserInfo.instance.user = null;
    clearKey(SharedKey.sellerToken.name);
    clearKey(SharedKey.userInfo.name);
    clearKey(SharedKey.userName.name);
  }
}

class DataConstant {
  static double lat = 0;
  static double lng = 0;
}
