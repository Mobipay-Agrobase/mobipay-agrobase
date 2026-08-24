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
import 'package:agrobase_ekibbo/models/information/check_fishing_response.dart';
import 'package:agrobase_ekibbo/presentation/farmer_list/views/screen_search_farmer.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';

class ScreenAddCheckFishing extends StatefulWidget {
  const ScreenAddCheckFishing({super.key, this.params});
  final CheckFishingResponse? params;

  @override
  State<ScreenAddCheckFishing> createState() => _CheckFishingState();
}

class _CheckFishingState extends State<ScreenAddCheckFishing> {
  final _formKey = GlobalKey<FormState>();
  late CheckFishingResponse body;

  final _ctrlWeight = TextEditingController();
  final _ctrlNumber = TextEditingController();
  final _ctrlRemark = TextEditingController();

  XFile? _photo;
  String initValuePhoto = '';

  List<FarmLandModel> _ponds = [];
  int? _pondIndex;
  String initValuePond = '';

  final List<String> _types = ['Mutual', 'Individual'];
  int? _typeIndex;

  String initValueFarmer = '';
  int farmerId = 0;
  String? _farmerError;

  final _ctrlDateAdd = TextEditingController(
      text: DateHelper.convertDateToStr(DateTime.now(), format: "dd/MM/yyyy"));
  DateTime? dateAdd;

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
      body = CheckFishingResponse.fromJson({});
      return;
    }
    body = CheckFishingResponse.copy(widget.params!);
    farmerId = body.farmerId.toInt();
    initValueFarmer = body.farmerName;
    initValuePond = body.pondName;
    _ctrlDateAdd.text = DateHelper.convertDateToStr(
      DateTime.fromMillisecondsSinceEpoch(body.date),
      format: "dd/MM/yyyy",
    );
    _ctrlNumber.text = body.number.toString();
    _ctrlWeight.text = body.weight.toString();
    _ctrlRemark.text = body.remark;
    initValuePhoto = "${EnvConfig.domainOrigin}/${body.photo}";
    _typeIndex = _types.indexWhere((e) => e == body.typesOfCheckFishing);
  }

  @override
  void initState() {
    super.initState();
    setup();
  }

  @override
  void dispose() {
    _ctrlDateAdd.dispose();
    _ctrlWeight.dispose();
    _ctrlNumber.dispose();
    _ctrlRemark.dispose();
    _photo = null;
    _ponds.clear();
    _pondIndex = null;
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
      if (_typeIndex == null) {
        DialogHelper.showOkDialog(context, 'Please select type!');
        return;
      }
      if (_photo == null) {
        DialogHelper.showOkDialog(context, 'Please select photo!');
        return;
      }
    }

    if (widget.params == null) {
      body.date = DateTime.now().millisecondsSinceEpoch;
      body.farmerId = farmerId;
      body.pondId = _ponds[_pondIndex!].id ?? 0;
      body.typesOfCheckFishing = _types[_typeIndex!];
      body.simpleId = '';
    }
    body.weight = num.tryParse(_ctrlWeight.text) ?? 0;
    body.remark = _ctrlRemark.text;
    body.number = num.tryParse(_ctrlNumber.text) ?? 0;

    if (_photo != null) {
      final res = await ApiUpload.uploads({'photo': _photo!});
      if (res == null) {
        DialogHelper.showOkDialog(context, "Upload photo faild!");
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
    final res = await ApiProvider.instance.apiCheckFishing
        .add(jsonEncode(body.toJson()));

    if (res?.data) {
      DialogHelper.showToastSuccess(context);
      DListingData.instance.checkFishings = null;
      Navigator.of(context).pop(true);
    } else {
      DialogHelper.showOkDialog(context, 'Insert data faild!');
    }
  }

  onUpdate() async {
    final res = await ApiProvider.instance.apiCheckFishing
        .update(widget.params?.id.toString() ?? '0', jsonEncode(body.toJson()));

    if (res?.data) {
      DialogHelper.showToastSuccess(context);
      DListingData.instance.checkFishings = null;
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
          title: "Check Fishing",
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
                          itemSelected: initValuePond,
                          isDisable: widget.params != null,
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
                          hintText: "Types of Check Fishing",
                          items: _types,
                          itemSelected:
                              _typeIndex == null ? '' : _types[_typeIndex!],
                          isDisable: widget.params != null,
                          onChanged: (v) {
                            setState(() {
                              _typeIndex = v;
                              _ctrlNumber.text = '0';
                            });
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'Weight',
                          keyboardType: TextInputType.number,
                          controller: _ctrlWeight,
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
                        _typeIndex == null || _typeIndex == 1
                            ? const SizedBox.shrink()
                            : Padding(
                                padding: const EdgeInsets.only(bottom: 24),
                                child: AppFormField(
                                  labelText: 'Number',
                                  keyboardType: TextInputType.number,
                                  controller: _ctrlNumber,
                                  validator: (v) {
                                    if (v == null || v.isEmpty) {
                                      return AppLang
                                          .local.please_fill_field_name;
                                    }
                                    return null;
                                  },
                                ),
                              ),
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
