// ignore_for_file: use_build_context_synchronously

import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mime/mime.dart';
import 'package:provider/provider.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/input/input_next_data.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/crop/dropdown_crop_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/presentation/farmer_list/views/screen_search_farmer.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_farmland.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';

class AddCropScreen extends StatefulWidget {
  const AddCropScreen({
    super.key,
    this.crop,
    this.farmland,
    this.farmer,
  });
  final CultivationModel? crop;
  final FarmLandModel? farmland;
  final FarmerModel? farmer;
  @override
  State<AddCropScreen> createState() => _AddCropScreenState();
}

class _AddCropScreenState extends State<AddCropScreen> {
  List<SeasonModel> _seasons = [];
  List<DropdownMasterModel> _cropCultivates = [];

  /// ALL crop varieties from the CropVariety master (each carries crop_id).
  /// Fetched once with the cultivation dropdowns, then filtered locally by
  /// the selected crop — the variety list depends on the crop (Ekibbo
  /// requirement) and now loads from the WEB Crop/CropVariety masters.
  List<CropVarietyMasterModel> _allVarieties = [];
  List<FarmLandModel> _farmlandsOrigin = [];
  List<FarmLandModel> _farmlands = [];
  int? _seasonsIndex;
  int? _cultivateIndex;
  int? _farmIndex;
  String? _variety;
  String? _farmerError;
  String? _farmError;
  String? _seasonError;
  String? _cultivatedError;
  String? _varietyError;
  final _formKey = GlobalKey<FormState>();
  final _estYieldTxtController = TextEditingController();
  XFile? _photo;
  String initValueFarmer = '';

  final ctrlSowingDate = TextEditingController(
      text: DateHelper.convertDateToStr(DateTime.now(), format: "dd/MM/yyyy"));
  final ctrlExpectDate = TextEditingController(
      text: DateHelper.convertDateToStr(DateTime.now(), format: "dd/MM/yyyy"));
  DateTime? dateSowing;
  DateTime? dateExpect;

  List<CropVarietyMasterModel> _varieties = [];

  /// Farm land id to auto-select once the farmer's lands arrive (edit mode).
  int? _pendingFarmId;
  @override
  void initState() {
    _getCropDropdown();
    super.initState();
  }

  @override
  void dispose() {
    ctrlSowingDate.dispose();
    ctrlExpectDate.dispose();
    NavigatorManager.contextRoot
        .read<AppProvider>()
        .updateState(AppEvent.appSearchResetData);
    super.dispose();
  }

  _getCropDropdown() async {
    // Uses /mobile/ekibbo-cultivation-dropdowns: seasons + CROPS from the
    // CropMaster + ALL crop varieties (with crop_id). Farm lands are NOT in
    // this payload (they depend on the chosen farmer) — they are fetched
    // separately via /mobile/ekibbo-farmlands/{farmerId} once a farmer is
    // picked (see _loadFarmlandsFor).
    final res = await ApiProvider.instance.apiCrop.getCultivationDropdowns();
    if (res?.data != null) {
      setState(() {
        _seasons = res!.data?.season ?? [];
        _cropCultivates = res.data?.cropInformation ?? [];
        _allVarieties = res.data?.cropVariety ?? [];
        _setData();
      });
    }
  }

  /// Fetch the selected farmer's registered farm lands from the web
  /// platform (/mobile/ekibbo-farmlands/{farmerId}) so the land picker is
  /// populated correctly (previously it filtered an always-empty list).
  _loadFarmlandsFor(int? farmerId) async {
    if (farmerId == null) return;
    final lands = await ApiFarmland.getFarmlandByFarmerId(farmerId);
    if (!mounted) return;
    setState(() {
      _farmlandsOrigin = lands;
      _farmlands = lands;
      // Re-apply a pending pre-selection (edit mode) once the list lands.
      if (_pendingFarmId != null) {
        _farmIndex = _farmlands.getIndex((p0) => p0.id == _pendingFarmId);
        if (_farmIndex != null) _pendingFarmId = null;
      } else {
        _farmIndex = null;
      }
    });
  }

  /// Dependent variety list: only the varieties whose crop_id matches the
  /// selected crop. Runs entirely client-side after the single dropdown
  //  fetch — no per-crop network call (the legacy /crops/get_crop_variety
  /// endpoint does not exist on the web platform).
  _getVarieyty() {
    if (_cultivateIndex == null || _cropCultivates.isEmpty) {
      setState(() {
        _varieties = [];
      });
      return;
    }
    final selectedCropId = _cropCultivates[_cultivateIndex!].id;
    setState(() {
      _varieties = _allVarieties
          .where((v) => v.cropId == selectedCropId)
          .toList();
    });
  }

  _setData() {
    if (widget.farmer != null) {
      initValueFarmer = widget.farmer!.showInputName;
      // Fetch this farmer's lands from the server (the dropdown payload no
      // longer carries farm lands without a farmerId).
      _loadFarmlandsFor(widget.farmer!.id);
    }
    if (widget.farmland != null) {
      _farmIndex = _farmlands.getIndex((p0) => p0.id == widget.farmland!.id);
      if (_farmIndex == null) {
        // The land list may not be loaded yet — remember the selection and
        // apply it after the lands arrive (see _loadFarmlandsFor).
        _pendingFarmId = widget.farmland!.id;
      }
    }
    if (widget.crop != null) {
      final crop = widget.crop!;
      _pendingFarmId = crop.farmLandId;
      _seasonsIndex = _seasons.getIndex((p0) => p0.id == crop.season?.id);
      _cultivateIndex =
          _cropCultivates.getIndex((p0) => p0.id == crop.cropsMaster?.id);
      _variety = crop.cropVariety;
      // Pre-populate the dependent variety list for the pre-selected crop
      // so the dropdown shows the right rows (and the saved value stays
      // selected) when EDITING an existing cultivation.
      if (_cultivateIndex != null && _cropCultivates.isNotEmpty) {
        final selectedCropId = _cropCultivates[_cultivateIndex!].id;
        _varieties = _allVarieties
            .where((v) => v.cropId == selectedCropId)
            .toList();
      }
      if (crop.sowingDate != null) {
        ctrlSowingDate.text = crop.sowingDate!;
        dateSowing = DateHelper.convertStrToDate(crop.sowingDate!);
      }
      if (crop.expectDate != null) {
        ctrlExpectDate.text = crop.expectDate!;
        dateExpect = DateHelper.convertStrToDate(crop.expectDate!);
      }
      _estYieldTxtController.text = crop.estYield ?? '';
    }
  }

  _onSubmit() async {
    bool isValid = true;
    if (initValueFarmer.isEmpty) {
      _farmerError = AppLang.local.please_choose_farmer;
      isValid = false;
    } else {
      _farmerError = null;
    }
    if (_farmIndex == null) {
      _farmError = AppLang.local.please_choose_farmland;
      isValid = false;
    } else {
      _farmError = null;
    }
    if (_seasonsIndex == null) {
      _seasonError = AppLang.local.please_choose_harvest_season;
      isValid = false;
    } else {
      _seasonError = null;
    }
    if (_cultivateIndex == null) {
      _cultivatedError = AppLang.local.please_choose_crop_cultivated;
      isValid = false;
    } else {
      _cultivatedError = null;
    }
    if (_variety == null) {
      _varietyError = AppLang.local.please_choose_crop_variety;
      isValid = false;
    } else {
      _varietyError = null;
    }

    if (!_formKey.currentState!.validate()) {
      isValid = false;
    }
    if (!isValid) {
      setState(() {});
      return;
    }
    _addCrop();
  }

  _addCrop() async {
    final data = {
      'farmer_id': _farmlands[_farmIndex!].farmerId,
      'farm_land_id': _farmlands[_farmIndex!].id,
      'crop_master_id': _cropCultivates[_cultivateIndex!].id,
      'season_id': _seasons[_seasonsIndex!].id,
      'crop_variety': _variety,
      'sowing_date': ctrlSowingDate.text,
      'expect_date': ctrlExpectDate.text,
      'est_yield': _estYieldTxtController.text,
      'staff_lat': DataConstant.lat,
      'staff_lng': DataConstant.lng,
    };

    var form = FormData.fromMap(
      data,
    );
    if (_photo != null) {
      form.files.addAll([
        MapEntry(
          'photo[]',
          MultipartFile.fromFileSync(
            _photo!.path,
            contentType: MediaType.parse(lookupMimeType(_photo!.path) ?? ''),
          ),
        ),
      ]);
    }
    if (widget.crop != null) {
      _updateCrop(form);
      return;
    }
    try {
      DialogHelper.showLoading();
      final res = await ApiProvider.instance.apiCrop.addCrop(form);
      DialogHelper.hideLoading();
      if (res?.data != null) {
        Navigator.of(context).pop(true);
        DialogHelper.showToast(
            context, AppLang.local.crop_created_successfully);
      }
    } catch (_) {}
  }

  _updateCrop(FormData form) async {
    try {
      DialogHelper.showLoading();
      final res =
          await ApiProvider.instance.apiCrop.updateCrop(form, widget.crop!.id!);
      DialogHelper.hideLoading();
      if (res?.data != null) {
        Navigator.of(context).pop(true);
        DialogHelper.showToast(context, AppLang.local.crop_update_successfully);
      }
    } catch (_) {}
  }

  Future<void> _selectSowingDate() async {
    final DateTime? picked = await DateHelper.showDateDialog(
      context,
      initialDate: dateSowing ?? DateTime.now(),
      firstDate: DateTime(1900, 1),
    );
    if (picked != null && picked != dateSowing) {
      dateSowing = picked;
      ctrlSowingDate.text =
          DateHelper.convertDateToStr(dateSowing!, format: "dd/MM/yyyy");
      setState(() {});
    }
  }

  Future<void> _selectExpectDate() async {
    final DateTime? picked = await DateHelper.showDateDialog(
      context,
      initialDate: dateExpect ?? DateTime.now(),
      firstDate: DateTime(1900, 1),
    );
    if (picked != null && picked != dateExpect) {
      dateExpect = picked;
      ctrlExpectDate.text =
          DateHelper.convertDateToStr(dateExpect!, format: "dd/MM/yyyy");
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: CustomAppBar(
          title: AppLang.local.add_crop,
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    child: Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          InputNextData(
                            hintText: AppLang.local.farmer,
                            errorText: _farmerError ?? '',
                            initValue: initValueFarmer,
                            onChange: () async {
                              if (widget.crop != null) return;
                              final res = await Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => ScreenSearchFarmer(
                                    argument: ArgumentScreenSearchFarmer(
                                        farmerSelected: initValueFarmer),
                                  ),
                                ),
                              );
                              if (res is ArgumentScreenSearchFarmer) {
                                setState(() {
                                  initValueFarmer = res.farmerSelected;
                                });
                                // Fetch the newly selected farmer's lands
                                // from the web platform so the land picker
                                // actually populates.
                                await _loadFarmlandsFor(res.farmerId);
                              }
                            },
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          AppDropdownButton(
                            hintText: AppLang.local.field_name,
                            items: _farmlands
                                .map((e) => e.farmName ?? '')
                                .toList(),
                            itemSelected: _farmIndex == null
                                ? ''
                                : _farmlands[_farmIndex!].farmName,
                            onChanged: (v) {
                              setState(() {
                                _farmIndex = v;
                              });
                            },
                            error: _farmError,
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          AppDropdownButton(
                            hintText: '${AppLang.local.harvest_season} *',
                            items: _seasons
                                .map((e) => e.seasonName ?? '')
                                .toList(),
                            itemSelected: _seasonsIndex == null
                                ? ''
                                : _seasons[_seasonsIndex!].seasonName,
                            onChanged: (v) {
                              setState(() {
                                _seasonsIndex = v;
                              });
                            },
                            error: _seasonError,
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          AppDropdownButton(
                            hintText: '${AppLang.local.crop_cultivated} *',
                            items: _cropCultivates
                                .map((e) => e.name ?? '')
                                .toList(),
                            itemSelected: _cultivateIndex == null
                                ? ''
                                : _cropCultivates[_cultivateIndex!].name,
                            onChanged: (v) {
                              setState(() {
                                _cultivateIndex = v;
                                _variety = null;
                              });
                              _getVarieyty();
                            },
                            error: _cultivatedError,
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          AppDropdownButton(
                            hintText: '${AppLang.local.crop_variety} *',
                            items: _varieties.map((e) => e.name ?? '').toList(),
                            itemSelected: _variety,
                            onChanged: (v) {
                              setState(() {
                                _variety = _varieties[v].name;
                              });
                            },
                            error: _varietyError,
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          Padding(
                            padding: const EdgeInsets.only(bottom: 24.0),
                            child: InkWell(
                              onTap: _selectSowingDate,
                              child: IgnorePointer(
                                child: AppFormField(
                                  controller: ctrlSowingDate,
                                  hint: '${AppLang.local.sowing_date} *',
                                  readOnly: true,
                                  validator: (v) {
                                    if (v == null || v.isEmpty) {
                                      return AppLang.local.please_fill_name;
                                    }
                                    return null;
                                  },
                                  prefixIcon: Padding(
                                    padding: const EdgeInsets.only(
                                        left: 16, right: 16),
                                    child:
                                        SvgPicture.asset('ic_calendar'.iconSvg),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.only(bottom: 24.0),
                            child: InkWell(
                              onTap: _selectExpectDate,
                              child: IgnorePointer(
                                child: AppFormField(
                                  controller: ctrlExpectDate,
                                  hint:
                                      '${AppLang.local.expected_date_harvest} *',
                                  readOnly: true,
                                  validator: (v) {
                                    if (v == null || v.isEmpty) {
                                      return AppLang.local.please_fill_name;
                                    }
                                    return null;
                                  },
                                  prefixIcon: Padding(
                                    padding: const EdgeInsets.only(
                                        left: 16, right: 16),
                                    child:
                                        SvgPicture.asset('ic_calendar'.iconSvg),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          AppFormField(
                            controller: _estYieldTxtController,
                            labelText: '${AppLang.local.est_yield} *',
                            keyboardType: TextInputType.number,
                            suffixIcon: Padding(
                              padding:
                                  const EdgeInsets.only(top: 16, bottom: 16),
                              child: Text(
                                'kg',
                                style: TextStyleConstant.quicksandW600(
                                  color: ColorConstant.text79.withOpacity(0.3),
                                ),
                              ),
                            ),
                            validator: (v) {
                              if (v == null || v.isEmpty) {
                                return AppLang.local.please_fill_est_yield;
                              }
                              return null;
                            },
                          ),
                          const SizedBox(
                            height: 24,
                          ),
                          _buildPhoto(context),
                        ],
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(
                    top: 16,
                    bottom: 16,
                  ),
                  child: AppButton(
                    onTap: _onSubmit,
                    title: AppLang.local.submit,
                    height: 46,
                  ),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }

  StatefulBuilder _buildPhoto(BuildContext context) {
    return StatefulBuilder(
      builder: (_, s) => Row(
        children: [
          InkWell(
            onTap: () async {
              _photo = await CommonHelper.chooseImgOptions(context);
              s(() {});
            },
            child: Container(
              height: 94,
              width: 160,
              clipBehavior: Clip.hardEdge,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: ColorConstant.grayF6F7F9,
              ),
              child: _photo != null
                  ? GImage.file(file: File(_photo!.path))
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SvgPicture.asset(
                          'ic_bold_camera'.iconSvg,
                        ),
                        const SizedBox(
                          height: 4,
                        ),
                        Text(
                          AppLang.local.crop_photos,
                          style: TextStyleConstant.quicksandW600(
                            color: ColorConstant.text79,
                          ),
                        )
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
