import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';

// Second review (E/F): equipment + animal husbandry tabs REMOVED.
enum FarmerDetailMenu {
  overview,
  about,
  family,
  assets,
  bank,
  finance,
  insurance,
  certificate,
}

extension FarmerDetailMenuExt on FarmerDetailMenu {
  String getTitle() {
    switch (this) {
      case FarmerDetailMenu.overview:
        return AppLang.local.overview;
      case FarmerDetailMenu.about:
        return AppLang.local.about;
      case FarmerDetailMenu.family:
        return AppLang.local.family;
      case FarmerDetailMenu.assets:
        return AppLang.local.asset;
      case FarmerDetailMenu.bank:
        return AppLang.local.bank;
      case FarmerDetailMenu.finance:
        return AppLang.local.finance_info;
      case FarmerDetailMenu.insurance:
        return AppLang.local.insurance_info;
      case FarmerDetailMenu.certificate:
        return AppLang.local.certificate_info;
    }
  }
}
