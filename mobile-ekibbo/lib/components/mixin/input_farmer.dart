import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/input/input_next_data.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';
import 'package:agrobase_ekibbo/presentation/farmer_list/views/screen_search_farmer.dart';

mixin InputFarmerMixin {
  String initValueFarmer = '';
  int farmerId = 0;
  String farmerPhone = '';

  Future<void> onChangeFarmer(BuildContext context,
      {int cooperativeId = 0,
      int provinceId = 0,
      int communeId = 0,
      int hasData = 0}) async {
    final response = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ScreenSearchFarmer(
          argument: ArgumentScreenSearchFarmer(
            farmerSelected: initValueFarmer,
            cooperativeId: cooperativeId,
            provinceId: provinceId,
            communeId: communeId,
            hasData: hasData,
          ),
        ),
      ),
    );
    if (response is ArgumentScreenSearchFarmer) {
      initValueFarmer = response.farmerSelected;
      farmerId = response.farmerId;
      cooperativeId = response.cooperativeId;
      farmerPhone = response.farmerPhone;
    }
  }

  inputFarmerMixin(BuildContext context,
          {int cooperativeId = 0,
          int provinceId = 0,
          int communeId = 0,
          int hasData = 0}) =>
      InputNextData(
        hintText: "${AppLang.local.farmer} *",
        errorText: '',
        initValue: initValueFarmer,
        onChange: () => onChangeFarmer(
          context,
          cooperativeId: cooperativeId,
          provinceId: provinceId,
          communeId: communeId,
          hasData: hasData,
        ),
      );
}
