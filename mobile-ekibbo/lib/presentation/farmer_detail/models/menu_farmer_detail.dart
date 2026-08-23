import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';

enum FarmerDetailMenu {
  overview,
  about,
  family,
  assets,
  bank,
  finance,
  insurance,
  equipment,
  animal,
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
      case FarmerDetailMenu.equipment:
        return AppLang.local.farm_equipment;
      case FarmerDetailMenu.animal:
        return AppLang.local.animal_husbandry;
      case FarmerDetailMenu.certificate:
        return AppLang.local.certificate_info;
    }
  }
}
