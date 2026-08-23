// ignore_for_file: use_build_context_synchronously

import 'dart:convert';
import 'dart:io';
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
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_farmland.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_upload.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_listings.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/models/information/water_quality_response.dart';
import 'package:agrobase_ekibbo/presentation/farmer_list/views/screen_search_farmer.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';

class WaterQualityInformation extends StatefulWidget {
  const WaterQualityInformation({super.key, this.params});
  final WaterQualityInfoResponse? params;

  @override
  State<WaterQualityInformation> createState() =>
      _WaterQualityInformationState();
}

class _WaterQualityInformationState extends State<WaterQualityInformation> {
  final _formKey = GlobalKey<FormState>();
  late WaterQualityInfoResponse body;

  final _ctrlTemperature = TextEditingController();
  final _ctrlO2Surface = TextEditingController();
  final _ctrlO2Depth = TextEditingController();
  final _ctrlS = TextEditingController();
  final _ctrlPh = TextEditingController();
  final _ctrlAmmonia = TextEditingController();
  final _ctrlNitrites = TextEditingController();
  final _ctrlNitrates = TextEditingController();
  final _ctrlRemark = TextEditingController();

  XFile? _photo;
  String initValuePhoto = '';

  List<FarmLandModel> _ponds = [];
  int? _pondIndex;
  String initValuePond = '';

  String initValueFarmer = '';
  int farmerId = 0;
  String? _farmerError;

  final _ctrlDateAdd = TextEditingController(
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

  setup() {
    if (widget.params == null) {
      body = WaterQualityInfoResponse.fromJson({});
      return;
    }
    body = WaterQualityInfoResponse.copy(widget.params!);
    farmerId = body.farmerId.toInt();
    initValueFarmer = body.farmerName;
    initValuePond = body.pondName;
    _ctrlDateAdd.text = DateHelper.convertDateToStr(
      DateTime.fromMillisecondsSinceEpoch(body.date),
      format: "dd/MM/yyyy",
    );
    initValuePhoto = "${EnvConfig.domainOrigin}/${body.photo}";
    _ctrlRemark.text = body.remark;

    _ctrlTemperature.text = body.temperature.toString();
    _ctrlO2Surface.text = body.o2Surface.toString();
    _ctrlO2Depth.text = body.o2Depth.toString();
    _ctrlPh.text = body.ph.toString();
    _ctrlS.text = body.salinity.toString();
    _ctrlAmmonia.text = body.ammonia.toString();
    _ctrlNitrites.text = body.nitrites.toString();
    _ctrlNitrates.text = body.nitrates.toString();
  }

  @override
  void initState() {
    super.initState();
    setup();
  }

  @override
  void dispose() {
    _ctrlTemperature.dispose();
    _ctrlO2Surface.dispose();
    _ctrlO2Depth.dispose();
    _ctrlPh.dispose();
    _ctrlS.dispose();
    _ctrlAmmonia.dispose();
    _ctrlNitrites.dispose();
    _ctrlNitrates.dispose();
    _ctrlRemark.dispose();
    _ctrlDateAdd.dispose();
    _photo = null;
    _ponds.clear();
    _pondIndex = null;
    NavigatorManager.contextRoot
        .read<AppProvider>()
        .updateState(AppEvent.appSearchResetData);
    super.dispose();
  }

  _onSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (widget.params == null) {
      if (farmerId == 0) {
        DialogHelper.showOkDialog(context, 'Please select farmer!');
        return;
      }
      if (_pondIndex == null) {
        DialogHelper.showOkDialog(context, 'Please select pond!');
        return;
      }
      if (_photo == null) {
        DialogHelper.showOkDialog(context, 'Please select photo!');
        return;
      }
    }

    if (widget.params == null) {
      body.farmerId = farmerId;
      body.pondId = _ponds[_pondIndex!].id ?? 0;
      body.date = DateTime.now().millisecondsSinceEpoch;
    }
    body.temperature = double.tryParse(_ctrlTemperature.text) ?? 0;
    body.o2Surface = double.tryParse(_ctrlO2Surface.text) ?? 0;
    body.o2Depth = double.tryParse(_ctrlO2Depth.text) ?? 0;
    body.salinity = double.tryParse(_ctrlS.text) ?? 0;
    body.ph = double.tryParse(_ctrlPh.text) ?? 0;
    body.ammonia = double.tryParse(_ctrlAmmonia.text) ?? 0;
    body.nitrites = double.tryParse(_ctrlNitrites.text) ?? 0;
    body.nitrates = double.tryParse(_ctrlNitrates.text) ?? 0;
    body.remark = _ctrlRemark.text;

    if (_photo != null) {
      final res = await ApiUpload.uploads({'photo': _photo!});
      if (res == null) {
        DialogHelper.showOkDialog(context, "Upload photo fail!");
        return;
      }
      _photo = null;
      body.photo = res['photo'] ?? '';
      initValuePhoto = "${EnvConfig.domainOrigin}/${body.photo}";
    }

    if (widget.params == null) {
      onInsert();
    } else {
      onUpdate();
    }
  }

  onInsert() async {
    final res = await ApiProvider.instance.apiWaterQuality
        .add(jsonEncode(body.toJson()));

    if (res?.data) {
      DialogHelper.showToastSuccess(context);
      DListingData.instance.waterQualities = null;
      Navigator.of(context).pop(true);
    } else {
      DialogHelper.showOkDialog(context, 'Insert data fail!');
    }
  }

  onUpdate() async {
    final res = await ApiProvider.instance.apiWaterQuality
        .update(widget.params?.id.toString() ?? '0', jsonEncode(body.toJson()));

    if (res?.data) {
      DialogHelper.showToastSuccess(context);
      DListingData.instance.waterQualities = null;
      Navigator.of(context).pop(true);
    } else {
      DialogHelper.showOkDialog(context, 'Update data fail!');
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: const CustomAppBar(
          title: "Water Quality Information",
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
                        const SizedBox(height: 24),
                        AppFormField(
                          controller: _ctrlDateAdd,
                          hint: 'Date *',
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
                          readOnly: widget.params != null,
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
                          items: _ponds.map((e) => e.farmName!).toList(),
                          isDisable: widget.params != null,
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
                        AppFormField(
                          labelText: 'Temperature',
                          controller: _ctrlTemperature,
                          keyboardType: TextInputType.number,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'Dissolved O2 at surface(mg/l)',
                          keyboardType: TextInputType.number,
                          controller: _ctrlO2Surface,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'Dissolved O2 at depth (mg/l)',
                          keyboardType: TextInputType.number,
                          controller: _ctrlO2Depth,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'S',
                          keyboardType: TextInputType.number,
                          controller: _ctrlS,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'pH',
                          keyboardType: TextInputType.number,
                          controller: _ctrlPh,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'Ammonia(mg/l)',
                          keyboardType: TextInputType.number,
                          controller: _ctrlAmmonia,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'Nitrites(mg/l)',
                          keyboardType: TextInputType.number,
                          controller: _ctrlNitrites,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'Nitrates(mg/l)',
                          keyboardType: TextInputType.number,
                          controller: _ctrlNitrates,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'Remarks ',
                          controller: _ctrlRemark,
                          maxLines: 5,
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
