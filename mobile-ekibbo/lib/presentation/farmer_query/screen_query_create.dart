import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/common.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/input/input_dropdown_data.dart';
import 'package:agrobase_ekibbo/components/pick_photo.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_crop.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_farmer_info.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';

class ScreenQueryCreate extends StatefulWidget {
  const ScreenQueryCreate({super.key});

  @override
  State<ScreenQueryCreate> createState() => _ScreenQueryCreateState();
}

class _ScreenQueryCreateState extends State<ScreenQueryCreate> {
  final double widthPhoto = (NavigatorManager.size.width - 60) / 2;
  final currentStages = [
    "land preparation",
    "sowing",
    "rooting",
    "braching",
    "heading",
    "flowering",
    "graining",
    "harvest"
  ];
  final List<XFile> qcPhotos = [];

  FarmLandModel? farmLand;
  List<CultivationModel> cultivations = [];
  CultivationModel? cultivationModel;
  String currentStage = '';

  fetchCrop() async {
    final id = farmLand?.id;
    if (id == null) return;
    cultivations = await ApiCrop.fetchCropByFarmId(id);
    if (!mounted) return;
    setState(() {});
  }

  int? indexFarmland() {
    if (farmLand == null) return null;
    final lands = DFarmerInfo.instance.farmlands ?? [];
    if (lands.isEmpty) return null;
    final index = lands.indexWhere((element) => element.id == farmLand!.id);
    if (index == -1) return null;
    return index;
  }

  int? indexCrop() {
    if (cultivationModel == null) return null;
    if (cultivations.isEmpty) return null;
    final index = cultivations
        .indexWhere((element) => element.id == cultivationModel!.id);
    if (index == -1) return null;
    return index;
  }

  int? indexCurrentStage() {
    final index =
        currentStages.indexWhere((element) => element == currentStage);
    if (index == -1) return null;
    return index;
  }

  @override
  Widget build(BuildContext context) {
    // Defensive: farmlands may be null when no farmer is selected yet —
    // previously `farmlands!` crashed with "Null check operator used on a
    // null value" the moment the user opened the Create Farmer Query screen
    // from a context that did not preload DFarmerInfo.
    final farmlands = DFarmerInfo.instance.farmlands ?? [];
    final farmNames = farmlands
        .map((e) => e.farmName ?? '')
        .where((n) => n.isNotEmpty)
        .toList();
    return SafeArea(
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: const CustomAppBar(
          title: "Create Farmer Query",
        ),
        body: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: farmNames.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      'Please select a farmer with at least one plot first. Open a farmer from the Farmer List, then come back here.',
                      textAlign: TextAlign.center,
                      style: TextStyleConstant.robotoW400(
                        fontSize: 14,
                        color: ColorConstant.text79,
                      ),
                    ),
                  ),
                )
              : Column(
                  children: [
                    WidgetCommon.buildHeaderForm(AppLang.local.general_information),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16.0, top: 20),
                      child: InputDropDownData(
                        items: farmNames,
                        itemIndex: indexFarmland(),
                        hintText: "${AppLang.local.plot} *",
                        onChanged: (index) {
                          farmLand = farmlands[index];
                          cultivations.clear();
                          cultivationModel = null;
                          setState(() {});
                          fetchCrop();
                        },
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16.0),
                      child: InputDropDownData(
                        items: cultivations.map((e) => e.cropName!).toList(),
                        itemIndex: indexCrop(),
                        hintText: "${AppLang.local.crop} *",
                        onChanged: (index) {
                          cultivationModel = cultivations[index];
                          setState(() {});
                        },
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16.0),
                      child: InputDropDownData(
                        items: currentStages,
                        hintText: "Current Stage *",
                        itemIndex: indexCurrentStage(),
                        onChanged: (index) {
                          currentStage = currentStages[index];
                          setState(() {});
                        },
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.only(bottom: 16),
                      child: AppFormField(
                        hint: 'Your Query*',
                      ),
                    ),
                    Wrap(
                      children: [
                        ...qcPhotos
                            .map((e) => WPickPhoto(
                                  photo: e,
                                  width: widthPhoto,
                                  remove: () {
                                    qcPhotos.remove(e);
                                    setState(() {});
                                  },
                                ))
                            .toList(),
                        qcPhotos.length >= 3
                            ? const SizedBox.shrink()
                            : WPickPhoto(
                                width: widthPhoto,
                                isChanged: true,
                                onChossed: (photo) {
                                  qcPhotos.insert(0, photo!);
                                  setState(() {});
                                },
                              ),
                      ],
                    )
                  ],
                ),
        ),
      ),
    );
  }
}
