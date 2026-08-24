import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/common.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/input/input_dropdown_data.dart';
import 'package:agrobase_ekibbo/components/mixin/drop_cooperative.dart';
import 'package:agrobase_ekibbo/components/mixin/drop_crop.dart';
import 'package:agrobase_ekibbo/components/mixin/drop_farmland.dart';
import 'package:agrobase_ekibbo/components/mixin/input_date.dart';
import 'package:agrobase_ekibbo/components/mixin/input_farmer.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_procurement.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/presentation/procurement/models/crop_harvest_model.dart';
import 'package:agrobase_ekibbo/presentation/procurement/widget/crop_harvest_information.dart';

class ScreenCropHarvest extends StatefulWidget {
  const ScreenCropHarvest({super.key});

  @override
  State<ScreenCropHarvest> createState() => _ScreenCropHarvestState();
}

class _ScreenCropHarvestState extends State<ScreenCropHarvest>
    with
        InputDateMixin,
        InputFarmerMixin,
        DropCooperativeMixin,
        DropFarmLandMixin,
        DropCropMixin {
  List<MCropHarvest> cropHarvests = [];
  double actualArea = 0;

  @override
  void initState() {
    super.initState();
    fetchingData();
  }

  fetchingData() async {
    await Future.wait([
      fetchCooperative(),
      fetchDropSeason(),
    ]);
    setState(() {});
  }

  @override
  void dispose() {
    dateController.dispose();
    // Deferred: notifying listeners synchronously inside dispose() crashes
    // with "setState() or markNeedsBuild() called when widget tree was locked"
    // (the framework unmounts this screen with the tree locked). A microtask
    // runs right after the tree unlocks — same event-loop turn, no crash.
    Future.microtask(() {
      NavigatorManager.contextRoot
          .read<AppProvider>()
          .updateState(AppEvent.appSearchResetData);
    });
    super.dispose();
  }

  @override
  Future<void> onChangeFarmer(BuildContext context,
      {int cooperativeId = 0,
      int provinceId = 0,
      int communeId = 0,
      int hasData = 1}) async {
    await super.onChangeFarmer(
      context,
      cooperativeId: cooperativeId,
      communeId: communeId,
      hasData: hasData,
    );
    cropHarvests.clear();
    await fetchFarmland(farmerId);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.crop_harvest,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                WidgetCommon.buildHeaderForm(AppLang.local.general_information),
                Padding(
                    padding: const EdgeInsets.only(bottom: 24.0, top: 10),
                    child: inputDateMixin(context)),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24.0),
                  child: InputDropDownData(
                    hintText: AppLang.local.cooperative,
                    items: cooperatives.map((e) => e.name).toList(),
                    itemIndex: indexCooperative(),
                    onChanged: (index) {
                      cropHarvests.clear();
                      cooperativeId = cooperatives[index].id;
                      context.read<AppProvider>().updateState(
                          AppEvent.appSearchSetCooperative,
                          argument: {
                            "cooperativeId": cooperativeId,
                            "hasData": 1
                          });
                      setState(() {});
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24.0),
                  child: InputDropDownData(
                    items: seasons.map((e) => e.seasonName!).toList(),
                    hintText: AppLang.local.harvest_season,
                    itemIndex: indexSeason(),
                    onChanged: (index) {
                      cropHarvests.clear();
                      seasonId = seasons[index].id!;
                      setState(() {});
                    },
                  ),
                ),
                Padding(
                    padding: const EdgeInsets.only(bottom: 24.0),
                    child: inputFarmerMixin(context,
                        cooperativeId: cooperativeId, hasData: 1)),
                Padding(
                  padding: const EdgeInsets.only(bottom: 24.0),
                  child: InputDropDownData(
                    items: farmlands.map((e) => e.farmName!).toList(),
                    hintText: AppLang.local.farm_land,
                    itemIndex: indexFarmland(),
                    onChanged: (index) {
                      cropHarvests.clear();
                      farmlandId = farmlands[index].id ?? 0;
                      actualArea = double.parse(farmlands[index].actualArea ?? '0');
                    },
                  ),
                ),
                WidgetCommon.buildHeaderForm(
                    AppLang.local.crop_harvest_information),
                const SizedBox(height: 10),
                ...cropHarvests
                    .map(
                      (e) => CropHarvestInformation(
                        mCropHarvest: e,
                        remove: () {
                          cropHarvests.removeWhere((element) =>
                              element.cultivationId == e.cultivationId);
                          setState(() {});
                        },
                        edit: () {
                          _gotoAddCropHarvest(e.cultivationId);
                        },
                      ),
                    )
                    .toList(),
                const SizedBox(height: 10),
                _buildBtnAddProduct(),
                const SizedBox(height: 10),
                _buildBtnSubmit(),
                const SizedBox(height: 10),
              ],
            ),
          ),
        ),
      ),
    );
  }

  _buildBtnSubmit() {
    return Visibility(
      visible: cropHarvests.isNotEmpty,
      child: AppButton(
        title: AppLang.local.submit,
        height: 46,
        onTap: () async {
          if (cropHarvests.isEmpty) return;
          final data = {
            "harvest_date": dateController.text,
            "crop_harvests": cropHarvests.map((e) => e.toMap()).toList()
          };
          DialogHelper.showLoading();
          final res = await ApiProcurement.createCropHarvest(data);
          DialogHelper.hideLoading();
          if (res.result!) {
            // ignore: use_build_context_synchronously
            DialogHelper.showOkDialog(context, "Add Crop Harvest Success!",
                okAction: () {
              // ignore: use_build_context_synchronously
              Navigator.of(context).pop();
            });
          }
          // ignore: use_build_context_synchronously
          DialogHelper.showToast(context,
              res.message ?? "Something wrong here, please check again!");
        },
      ),
    );
  }

  _gotoAddCropHarvest(int cultivationId) {
    Navigator.of(context)
        .pushNamed(
      RouterName.add_crop_harvest,
      arguments: ArgumentAddCropHardvest(
          seasonId: seasonId,
          farmlandId: farmlandId,
          cultivationId: cultivationId,
          actualArea: actualArea,
          cropHarvests: cropHarvests,
          cropInformations: cropInformations),
    )
        .then((value) {
      if (value is ArgumentAddCropHardvest) {
        setState(() {
          cropHarvests = value.cropHarvests;
        });
      }
    });
  }

  _buildBtnAddProduct() {
    return AppButton(
      title: "Add Crop Information",
      height: 46,
      borderColor: ColorConstant.primary,
      color: Colors.white,
      titleStyle: TextStyleConstant.worksansW500(
        fontSize: 16,
        color: ColorConstant.primary,
      ),
      onTap: () {
        _gotoAddCropHarvest(0);
      },
    );
  }
}
