part of AppProvider;

class AppSettings {
  Locale locale = Locale(SharedPreferencesProvider.instance.appLang);
  bool isVi = SharedPreferencesProvider.instance.appLang == EAppLang.vi.name;
  bool isPro = SharedPreferencesProvider.instance.isEnvPro;
  String version =
      EnvConfig.version(SharedPreferencesProvider.instance.isEnvPro);
  MAppLang local = SharedPreferencesProvider.instance.localLang;

  Future switchLanguage() async {
    isVi = !isVi;
    if (isVi) {
      locale = Locale(EAppLang.vi.name);
      local = await DOrtherInfo.instance.setAppLang(EAppLang.vi.name);
      SharedPreferencesProvider.instance.setAppLang(EAppLang.vi.name);
    } else {
      locale = Locale(EAppLang.en.name);
      local = await DOrtherInfo.instance.setAppLang(EAppLang.en.name);
      SharedPreferencesProvider.instance.setAppLang(EAppLang.en.name);
    }
  }

  void switchMode() {
    isPro = !isPro;
    SharedPreferencesProvider.instance.switchMode();
    ApiProvider.instance.switchMode();
    version = EnvConfig.version(isPro);
    DListingData.instance.switchMode();
  }
}
