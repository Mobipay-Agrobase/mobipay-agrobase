import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';

enum EditFarmerType {
  basic,
  family,
  asset,
  bank,
  finance,
  insurance,
  equipment,
  animal,
  certificate,
}

extension EditFarmerTypeExt on EditFarmerType {
  String getIcon() {
    switch (this) {
      case EditFarmerType.basic:
        return 'ic_about';
      case EditFarmerType.family:
        return 'ic_family';
      case EditFarmerType.asset:
        return 'ic_assets';
      case EditFarmerType.bank:
        return 'ic_bank';
      case EditFarmerType.finance:
        return 'ic_dollar';
      case EditFarmerType.insurance:
        return 'ic_insurance';
      case EditFarmerType.equipment:
        return 'ic_tractor';
      case EditFarmerType.animal:
        return 'ic_chicken';
      case EditFarmerType.certificate:
        return 'ic_certificate';
    }
  }

  String getTitle() {
    switch (this) {
      case EditFarmerType.basic:
        return AppLang.local.basic_info;
      case EditFarmerType.family:
        return AppLang.local.family_info;
      case EditFarmerType.asset:
        return AppLang.local.asset_info;
      case EditFarmerType.bank:
        return AppLang.local.bank_info;
      case EditFarmerType.finance:
        return AppLang.local.finance_info;
      case EditFarmerType.insurance:
        return AppLang.local.insurance_info;
      case EditFarmerType.equipment:
        return AppLang.local.farm_equipment;
      case EditFarmerType.animal:
        return AppLang.local.animal_husbandry;
      case EditFarmerType.certificate:
        return AppLang.local.certificate_info;
    }
  }
}
