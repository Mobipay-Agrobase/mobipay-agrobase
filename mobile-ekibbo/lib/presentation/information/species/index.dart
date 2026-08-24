// ignore_for_file: use_build_context_synchronously

import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/components/input/input_next_data.dart';
import 'package:agrobase_ekibbo/domain/config/env_config.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_address.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_farmland.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_upload.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/models/information/species_response.dart';
import 'package:agrobase_ekibbo/presentation/farmer_list/views/screen_search_farmer.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';

class SpeciesInformation extends StatefulWidget {
  const SpeciesInformation({super.key, this.params});
  final SpeciesInfoResponse? params;

  @override
  State<SpeciesInformation> createState() => _SpeciesInformationState();
}

class _SpeciesInformationState extends State<SpeciesInformation> {
  late AppProvider appProvider;

  final _formKey = GlobalKey<FormState>();
  late SpeciesInfoResponse bodyData;

  final _ctrlSpeciesCount = TextEditingController();
  final _ctrlExpectedHarvestQty = TextEditingController();

  XFile? _photo;
  String initValuePhoto = '';

  List<FarmLandModel> _ponds = [];
  int? _pondIndex;
  String initValuePond = '';

  List<DropdownMasterModel> _species = [];
  int? _speciesIndex;
  String initValueSpecies = '';

  List<DropdownMasterModel> _varieties = [];
  int? _varietyIndex;
  String initValueVariety = '';

  String initValueFarmer = '';
  int farmerId = 0;
  String? _farmerError;

  final ctrlSpeciesDate = TextEditingController(
      text: DateHelper.convertDateToStr(DateTime.now(), format: "dd/MM/yyyy"));
  DateTime? dateSpecies;

  _getPondByFarmer() async {
    if (initValueFarmer.isEmpty) {
      DialogHelper.showOkDialog(context, AppLang.local.please_choose_farmer);
      return;
    }
    final res = await ApiFarmland.getFarmlandByFarmerId(farmerId);
    setState(() {
      _pondIndex = null;
      _ponds = res;
    });
  }

  _getCropDropdown() async {
    final res = await ApiAddress.getDropdownCropData();
    setState(() {
      _species = res.cropInformation ?? [];
    });
  }

  _getVariety() async {
    if (_speciesIndex == null) {
      return;
    }
    final res = await ApiProvider.instance.apiCrop
        .getVariety(_species[_speciesIndex!].id!);
    setState(() {
      _varietyIndex = null;
      _varieties = res?.data?.cropVariety ?? [];
    });
  }

  setup() async {
    await _getCropDropdown();
    if (widget.params == null) {
      bodyData = SpeciesInfoResponse.fromJson({});
    } else {
      bodyData = SpeciesInfoResponse.copy(widget.params!);
      initValueFarmer = bodyData.farmerName;
      _ctrlExpectedHarvestQty.text = bodyData.expectedHarvestQty.toString();
      _ctrlSpeciesCount.text = bodyData.speciesCount.toString();
      ctrlSpeciesDate.text = DateHelper.convertDateToStr(
        DateTime.fromMillisecondsSinceEpoch(bodyData.dateOfAdding),
        format: "dd/MM/yyyy",
      );
      initValuePond = bodyData.pondName;
      initValueSpecies = bodyData.speciesName;
      initValueVariety = bodyData.speciesVarietyName;
      farmerId = bodyData.farmerId.toInt();
      initValuePhoto = "${EnvConfig.domainOrigin}/${bodyData.photo}";

      if (widget.params!.tag.startsWith('insert_')) {
        _photo = XFile(bodyData.photo);
      }
      _speciesIndex = _species.indexWhere(
        (e) => e.id == bodyData.speciesId,
      );
      _getVariety();
    }
  }

  @override
  void initState() {
    super.initState();
    setup();
  }

  @override
  void dispose() {
    _ctrlSpeciesCount.dispose();
    _ctrlExpectedHarvestQty.dispose();
    ctrlSpeciesDate.dispose();
    _photo = null;
    _ponds.clear();
    _pondIndex = null;
    _species.clear();
    _speciesIndex = null;
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

  _onSubmit() async {
    try {
      final isInternetAvailable = await CommonHelper.isInternetAvailable();
      if (!isInternetAvailable) {
        if (_photo != null) bodyData.photo = _photo!.path;
        bodyData.dateOfAdding = dateSpecies == null
            ? DateTime.now().millisecondsSinceEpoch
            : dateSpecies!.millisecondsSinceEpoch;
        bodyData.speciesId = _species[_speciesIndex!].id ?? 0;
        bodyData.speciesName = _species[_speciesIndex!].name ?? '';
        bodyData.speciesCount = num.tryParse(_ctrlSpeciesCount.text) ?? 0;
        bodyData.expectedHarvestQty =
            num.tryParse(_ctrlExpectedHarvestQty.text) ?? 0;
        bodyData.tag = widget.params?.tag ?? '';
        context.read<AppProvider>().updateStateFuture(
            AppEvent.appSpeciesSaveToLocal,
            argument: bodyData);
        Navigator.of(context).pop();
        DialogHelper.showToast(context, 'The Species has been saved locally!');
        return;
      }

      if (!_formKey.currentState!.validate()) {
        return;
      }

      if (widget.params == null) {
        if (farmerId == 0) {
          DialogHelper.showOkDialog(
              context, AppLang.local.please_choose_farmer);
          return;
        }
        if (_pondIndex == null) {
          DialogHelper.showOkDialog(
              context, "AppLang.local.please_choose_pond");
          return;
        }
        if (_speciesIndex == null) {
          DialogHelper.showOkDialog(
              context, "AppLang.local.please_choose_species");
          return;
        }
        if (_varietyIndex == null) {
          DialogHelper.showOkDialog(
              context, "AppLang.local.please_choose_variety");
          return;
        }
        if (_photo == null) {
          DialogHelper.showOkDialog(context, 'Please select photo!');
          return;
        }
      }

      if (widget.params == null || widget.params!.tag.startsWith('insert_')) {
        bodyData.farmerId = farmerId;
        bodyData.pondId = _ponds[_pondIndex!].id ?? 0;
        bodyData.speciesId = _species[_speciesIndex!].id ?? 0;
        bodyData.varietyId = _varieties[_varietyIndex!].id ?? 0;
        bodyData.dateOfAdding = dateSpecies == null
            ? DateTime.now().millisecondsSinceEpoch
            : dateSpecies!.millisecondsSinceEpoch;
      }

      bodyData.speciesCount = num.tryParse(_ctrlSpeciesCount.text) ?? 0;
      bodyData.expectedHarvestQty =
          num.tryParse(_ctrlExpectedHarvestQty.text) ?? 0;
      bodyData.tag = widget.params?.tag ?? '';

      if (_photo != null) {
        final res = await ApiUpload.uploads({'photo': _photo!});
        if (res == null) {
          DialogHelper.showOkDialog(context, "AppLang.local.upload_failed");
          return;
        }
        _photo = null;
        bodyData.photo = res['photo'] ?? '';
        initValuePhoto = "${EnvConfig.domainOrigin}/${bodyData.photo}";
      }

      if (widget.params == null) {
        await onInsert();
        return;
      }
      if (widget.params!.tag.startsWith('insert_')) {
        await onInsert();
        return;
      }
      await onUpdate();
    } catch (e) {
      DialogHelper.hideLoading();
      if (e is DioException) {
        if (e.type == DioExceptionType.badResponse) {
          DialogHelper.showOkDialog(context, e.response?.data['message'] ?? '');
        } else {
          DialogHelper.showOkDialog(
              context, 'An unexpected error occurred: $e');
        }
      } else {
        DialogHelper.showOkDialog(context, 'An error occurred: $e');
      }
    }
  }

  onInsert() async {
    final res = await ApiProvider.instance.apiSpecies
        .add(jsonEncode(bodyData.toJson()));
    if (res?.data) {
      DialogHelper.showToastSuccess(context);
      context.read<AppProvider>().updateStateFuture(
          AppEvent.appSpeciesDeleteFromLocal,
          argument: bodyData.id.toString());
      Navigator.of(context).pop(true);
    } else {
      DialogHelper.showOkDialog(context, 'Insert data fail!');
    }
  }

  onUpdate() async {
    final res = await ApiProvider.instance.apiSpecies.update(
        widget.params?.id.toString() ?? '0', jsonEncode(bodyData.toJson()));
    if (res?.data) {
      DialogHelper.showToastSuccess(context);
      context.read<AppProvider>().updateStateFuture(
          AppEvent.appSpeciesDeleteFromLocal,
          argument: bodyData.id.toString());
      Navigator.of(context).pop(true);
    } else {
      DialogHelper.showOkDialog(context, 'Update data fail!');
    }
  }

  @override
  Widget build(BuildContext context) {
    appProvider = context.read<AppProvider>();
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: const CustomAppBar(
          title: "Species Information",
        ),
        body: Form(
          key: _formKey,
          child: Column(
            children: [
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 16,
                  ),
                  child: SingleChildScrollView(
                    child: Column(
                      children: [
                        AppFormField(
                          controller: ctrlSpeciesDate,
                          hint: 'Species date *',
                          readOnly: true,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_name;
                            }
                            return null;
                          },
                          prefixIcon: Padding(
                            padding: const EdgeInsets.only(left: 16, right: 16),
                            child: SvgPicture.asset('ic_calendar'.iconSvg),
                          ),
                        ),
                        const SizedBox(height: 24),
                        InputNextData(
                          hintText: AppLang.local.farmer,
                          errorText: _farmerError ?? '',
                          initValue: initValueFarmer,
                          readOnly: widget.params != null &&
                              widget.params!.tag.isEmpty,
                          onChange: () async {
                            final res = await Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) => ScreenSearchFarmer(
                                  argument: ArgumentScreenSearchFarmer(
                                      farmerSelected: initValueFarmer),
                                ),
                              ),
                            );
                            if (res is ArgumentScreenSearchFarmer) {
                              initValueFarmer = res.farmerSelected;
                              farmerId = res.farmerId;
                              _getPondByFarmer();
                            }
                          },
                        ),
                        const SizedBox(height: 24),
                        AppDropdownButton(
                          hintText: "Pond Name",
                          isDisable: widget.params != null &&
                              widget.params!.tag.isEmpty,
                          items: _ponds.map((e) => e.farmName!).toList(),
                          itemSelected: initValuePond,
                          onChanged: (v) {
                            setState(() {
                              _pondIndex = v;
                              initValuePond =
                                  _ponds[_pondIndex!].farmName ?? '';
                            });
                          },
                        ),
                        const SizedBox(height: 24),
                        AppDropdownButton(
                          hintText: "Species Name",
                          isDisable: widget.params != null &&
                              widget.params!.tag.isEmpty,
                          items: _species.map((e) => e.name!).toList(),
                          itemSelected: initValueSpecies,
                          onChanged: (v) {
                            setState(() {
                              _speciesIndex = v;
                              initValueSpecies =
                                  _species[_speciesIndex!].name ?? '';
                              _getVariety();
                            });
                          },
                        ),
                        const SizedBox(height: 24),
                        AppDropdownButton(
                          hintText: "Species Variety",
                          isDisable: widget.params != null &&
                              widget.params!.tag.isEmpty,
                          items: _varieties.map((e) => e.name!).toList(),
                          itemSelected: initValueVariety,
                          onChanged: (v) {
                            setState(() {
                              _varietyIndex = v;
                              initValueVariety =
                                  _varieties[_varietyIndex!].name ?? '';
                            });
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'Species Count',
                          keyboardType: TextInputType.number,
                          controller: _ctrlSpeciesCount,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(
                          height: 24,
                        ),
                        AppFormField(
                          labelText: 'Expected Harvest Qty(kg)',
                          keyboardType: TextInputType.number,
                          controller: _ctrlExpectedHarvestQty,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        StatefulBuilder(
                          builder: (_, s) => _buildImgView(
                            'Photo',
                            url: initValuePhoto,
                            chooseImg: () async {
                              _photo = await CommonHelper.chooseImg();
                              s(() {});
                            },
                            img: _photo,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(
                  left: 20,
                  right: 20,
                  bottom: 16,
                ),
                child: AppButton(
                  onTap: () {
                    _onSubmit();
                  },
                  title: AppLang.local.submit,
                  height: 46,
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImgView(
    String title, {
    XFile? img,
    Function()? chooseImg,
    String? url,
  }) {
    Widget view = Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SvgPicture.asset(
          'ic_bold_camera'.iconSvg,
        ),
        const SizedBox(
          height: 4,
        ),
        Text(
          AppLang.local.choose_photo,
          style: TextStyleConstant.quicksandW600(
            color: ColorConstant.text79,
          ),
        )
      ],
    );
    if (img != null) {
      view = GImage.file(file: File(img.path));
    } else if (url != null) {
      view = GInternetImage(url: url);
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style:
              TextStyleConstant.worksansW500(color: ColorConstant.gray6C757D),
        ),
        const SizedBox(
          height: 8,
        ),
        Row(
          children: [
            InkWell(
              onTap: chooseImg,
              child: Container(
                height: 94,
                width: 160,
                clipBehavior: Clip.hardEdge,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  color: ColorConstant.grayF6F7F9,
                ),
                child: view,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
