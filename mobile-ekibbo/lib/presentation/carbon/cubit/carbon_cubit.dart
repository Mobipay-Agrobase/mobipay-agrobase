import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/add_carbon_request_mode.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

part 'carbon_state.dart';
part 'carbon_cubit.freezed.dart';

class CarbonCubit extends Cubit<CarbonState> {
  CarbonCubit() : super(const CarbonState.initial());
  // general info
  List<FarmerModel> farmers = [];
  List<FarmLandModel> farmlands = [];
  List<CultivationModel> crops = [];
  final estYieldTxtCtrler = TextEditingController();
  final request = AddCarbonRequestModel();

  // crop estab
  final culPeriodCtrler = TextEditingController();

  final amountStrawCtrler = TextEditingController();
  final amountOrganicCtrler = TextEditingController();

  final n2RateCtrler = TextEditingController();
  final co2FromCtrler = TextEditingController();

  final truckCtrler = TextEditingController();
  final tractorCtrler = TextEditingController();
  final localBoatCtrler = TextEditingController();
  final shipCtrler = TextEditingController();

  final milledRiceCtrler = TextEditingController();
  final riceHuskCtrler = TextEditingController();
  final riceBranCtrler = TextEditingController();
  final riceStrawCtrler = TextEditingController();

  getAllFarmer() async {
    final res = await ApiProvider.instance.apiFarmer.getAllFarmers(null, '');
    farmers = res?.data?.farmerData?.data ?? [];
    if (farmers.isNotEmpty) {
      request.farmer = farmers[0];
      getFarmlands();
    }
    emit(const CarbonState.generalChanged());
  }

  getFarmlands() async {
    if (request.farmer == null) {
      return;
    }
    emit(const CarbonState.loading());
    final res = await ApiProvider.instance.apiFarmland
        .getAllFarmLands(request.farmer!.id!);
    farmlands = res?.data?.farmLandData ?? [];
    request.farmLand = null;
    emit(const CarbonState.generalChanged());
    if (farmlands.isNotEmpty) {
      request.farmLand = farmlands[0];
      getCrops();
    }
  }

  getCrops() async {
    if (request.farmLand == null) {
      return;
    }
    emit(const CarbonState.loading());
    final res = await ApiProvider.instance.apiFarmland
        .getCultivations(request.farmLand!.id!);
    crops = res?.data?.cultivation ?? [];
    request.cultivation = null;

    if (crops.isNotEmpty) {
      request.cultivation = crops[0];
      estYieldTxtCtrler.text = '${crops[0].estYield}';
    }
    emit(const CarbonState.generalChanged());
  }

  cultivationChanged(int index) {
    emit(const CarbonState.loading());
    request.cultivation = crops[index];
    estYieldTxtCtrler.text = '${crops[index].estYield}';
    emit(const CarbonState.generalChanged());
  }

  onSave() async {
    if (request.farmLand == null) {
      emit(CarbonState.validateFarmland(AppLang.local.please_choose_farmland));
      return;
    }
    if (request.cultivation == null) {
      emit(const CarbonState.validateCrop('Please choose crops!'));
      return;
    }
    DialogHelper.showLoading();
    final data = request.toJson();
    final res = await ApiProvider.instance.apiCarbon.createCarbonEmission(data);
    DialogHelper.hideLoading();
    if (res?.result == true) {
      Navigator.of(NavigatorManager.navigatorKey.currentContext!).pop();
      DialogHelper.showToast(NavigatorManager.navigatorKey.currentContext!,
          'Create Carbon Footprint Successfully');
    }
  }
}
