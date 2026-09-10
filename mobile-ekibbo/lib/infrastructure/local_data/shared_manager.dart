import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:agrobase_ekibbo/core/security/secure_token_store.dart';
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
  otaCatalog,
  otaCatalogSyncedAt,
  otaGeoSyncedAt,
  deviceId,
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

    // SECURITY (security review follow-up): auth tokens now live in OS
    // secure storage (keychain / keystore), NOT plaintext SharedPreferences.
    // One-time migration copies any legacy plaintext token over (so
    // upgrading field officers stay logged in) and wipes the old keys.
    await SecureTokenStore.instance.migrateFromSharedPreferences(_shared);
    accessToken = await SecureTokenStore.instance.readAccessToken() ?? '';
    sellerToken = await SecureTokenStore.instance.readSellerToken() ?? '';

    // Ekibbo deployment is English-only; ignore any stale 'vi' value.
    final storedLang = _getString(SharedKey.applang.name);
    appLang = storedLang == EAppLang.vi.name ? EAppLang.en.name : (storedLang ?? EAppLang.en.name);
    appMode = _getString(SharedKey.appMode.name) ?? EAppMode.pro.name;
    isEnvPro = appMode == EAppMode.pro.name ? true : false;
    localLang = await DOrtherInfo.instance.setAppLang(appLang);
    // Never log the token value itself — presence only.
    debugPrint('Access token loaded: ${accessToken.isNotEmpty}');
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

  /// Persist the auth token to OS secure storage (keystore/keychain).
  /// The in-memory field updates synchronously so every existing reader
  /// (interceptors, services) keeps working; callers that ignore the
  /// returned Future simply persist in the background.
  Future<void> setAccessToken(String value) {
    accessToken = value;
    return SecureTokenStore.instance.writeAccessToken(value);
  }

  /// Persist the seller token to OS secure storage.
  Future<void> setSellerToken(String value) {
    sellerToken = value;
    return SecureTokenStore.instance.writeSellerToken(value);
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

  /// Public passthroughs for services that persist their own keys
  /// (OTA cache, sync audit, device id).
  void setString(String key, String value) => _setString(key, value);
  String? getString(String key) => _getString(key);

  /// Stable per-install device id (sync audit trail).
  String get deviceId {
    var id = _getString(SharedKey.deviceId.name);
    if (id == null || id.isEmpty) {
      id = 'dev-${DateTime.now().millisecondsSinceEpoch}';
      _setString(SharedKey.deviceId.name, id);
    }
    return id;
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
    SecureTokenStore.instance.deleteSellerToken();
    sellerToken = '';
    clearKey(SharedKey.userInfo.name);
    clearKey(SharedKey.userName.name);
  }

  switchMode() {
    userInfo = null;
    setAccessToken('');
    setAppMode(isEnvPro ? EAppMode.dev.name : EAppMode.pro.name);
    DUserInfo.instance.user = null;
    SecureTokenStore.instance.deleteSellerToken();
    sellerToken = '';
    clearKey(SharedKey.userInfo.name);
    clearKey(SharedKey.userName.name);
  }
}

class DataConstant {
  static double lat = 0;
  static double lng = 0;
}
