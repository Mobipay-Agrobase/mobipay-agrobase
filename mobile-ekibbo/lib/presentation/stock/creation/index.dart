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
import 'package:agrobase_ekibbo/models/information/species_response.dart';
import 'package:agrobase_ekibbo/models/stock/creation_response.dart';
import 'package:agrobase_ekibbo/presentation/farmer_list/views/screen_search_farmer.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';

class StockCreation extends StatefulWidget {
  const StockCreation({super.key, this.params});
  final StockCreationResponse? params;

  @override
  State<StockCreation> createState() => _StockCreationState();
}

class _StockCreationState extends State<StockCreation> {
  final _formKey = GlobalKey<FormState>();
  late StockCreationResponse body;

  final _ctrlTotalPondArea = TextEditingController();
  final _ctrlCount = TextEditingController();
  final _ctrlWeight = TextEditingController();
  final _ctrlRemark = TextEditingController();
  final _ctrlSpeciesDate = TextEditingController();

  XFile? _photo;
  String initValuePhoto = '';

  List<FarmLandModel> _ponds = [];
  int? _pondIndex;
  String initValuePond = '';

  List<SpeciesInfoResponse> _species = [];
  int? _speciesIndex;
  String initValueSpecies = '';

  String initValueFarmer = '';
  int farmerId = 0;
  String? _farmerError;

  final _ctrlDateAdd = TextEditingController(
      text: DateHelper.convertDateToStr(DateTime.now(), format: "dd/MM/yyyy"));
  DateTime? dataAdd;

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

  _getSpecies() async {
    if (farmerId == 0 || _pondIndex == null) {
      DialogHelper.showOkDialog(context, AppLang.local.please_choose_farmer);
      return;
    }
    final res = await ApiProvider.instance.apiSpecies.fetch(
      farmerId.toString(),
      _ponds[_pondIndex!].id.toString(),
    );
    setState(() {
      _speciesIndex = null;
      _species = res?.data ?? [];
    });
  }

  setup() {
    if (widget.params == null) {
      body = StockCreationResponse.fromJson({});
      return;
    }
    body = StockCreationResponse.copy(widget.params!);
    farmerId = body.farmerId.toInt();
    initValueFarmer = body.farmerName;
    initValuePond = body.pondName;
    _ctrlDateAdd.text = DateHelper.convertDateToStr(
      DateTime.fromMillisecondsSinceEpoch(body.transactionDate),
      format: "dd/MM/yyyy",
    );
    _ctrlSpeciesDate.text = DateHelper.convertDateToStr(
      DateTime.fromMillisecondsSinceEpoch(body.dateOfAddingSpecies),
      format: "dd/MM/yyyy",
    );
    initValuePhoto = "${EnvConfig.domainOrigin}/${body.photo}";
    _ctrlRemark.text = body.remarks;

    initValueSpecies = body.speciesName;
    initValuePond = body.pondName;
    initValueSpecies = body.speciesName;
    _ctrlCount.text = body.speciesCount.toString();
    _ctrlTotalPondArea.text = body.totalPondArea.toString();
    _ctrlWeight.text = body.avgWeight.toString();
  }

  @override
  void initState() {
    super.initState();
    setup();
  }

  @override
  void dispose() {
    _ctrlSpeciesDate.dispose();
    _ctrlCount.dispose();
    _ctrlWeight.dispose();
    _ctrlTotalPondArea.dispose();
    _ctrlDateAdd.dispose();
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
        DialogHelper.showOkDialog(context, 'Please choose farmer!');
        return;
      }
      if (_pondIndex == null) {
        DialogHelper.showOkDialog(context, 'Please choose pond!');
        return;
      }
      if (_speciesIndex == null) {
        DialogHelper.showOkDialog(context, 'Please choose species!');
        return;
      }
      if (_photo == null) {
        DialogHelper.showOkDialog(context, 'Please select photo!');
        return;
      }
    }

    if (widget.params == null) {
      body.speciesInfoId = _species[_speciesIndex!].id;
      body.transactionDate = DateTime.now().millisecondsSinceEpoch;
    }
    body.avgWeight = double.tryParse(_ctrlWeight.text) ?? 0;
    body.remarks = _ctrlRemark.text;

    if (_photo != null) {
      final res = await ApiUpload.uploads({'photo': _photo!});
      if (res == null) {
        DialogHelper.showOkDialog(context, 'Upload photo fail!');
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
    final res = await ApiProvider.instance.apiStockCreation
        .add(jsonEncode(body.toJson()));

    if (res?.data) {
      DialogHelper.showToastSuccess(context);
      DListingData.instance.stockCreations = null;
      Navigator.of(context).pop(true);
    } else {
      DialogHelper.showOkDialog(context, 'Insert data fail!');
    }
  }

  onUpdate() async {
    final res = await ApiProvider.instance.apiStockCreation
        .update(widget.params?.id.toString() ?? '0', jsonEncode(body.toJson()));

    if (res?.data) {
      DialogHelper.showToastSuccess(context);
      DListingData.instance.stockCreations = null;
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
          title: "Stock Creation",
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
                          itemSelected: initValuePond,
                          isDisable: widget.params != null,
                          onChanged: (v) {
                            //setState(() {
                            _pondIndex = v;
                            _ctrlTotalPondArea.text =
                                _ponds[_pondIndex!].totalLandHolding.toString();
                            initValuePond = _ponds[_pondIndex!].farmName ?? '';
                            _getSpecies();
                            //});
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'Total pond area',
                          keyboardType: TextInputType.number,
                          controller: _ctrlTotalPondArea,
                          readOnly: true,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        AppDropdownButton(
                          hintText: "Species Name",
                          items: _species
                              .map((e) => e.speciesName.toString())
                              .toList(),
                          itemSelected: initValueSpecies,
                          isDisable: widget.params != null,
                          onChanged: (v) {
                            setState(() {
                              _speciesIndex = v;
                              final species = _species[_speciesIndex!];
                              initValueSpecies = species.speciesName;
                              _ctrlCount.text = species.speciesCount.toString();
                              _ctrlSpeciesDate.text =
                                  DateHelper.convertDateToStr(
                                DateTime.fromMillisecondsSinceEpoch(
                                  species.dateOfAdding,
                                ),
                                format: "dd/MM/yyyy",
                              );
                            });
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'Species Count',
                          keyboardType: TextInputType.number,
                          controller: _ctrlCount,
                          readOnly: widget.params != null,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          controller: _ctrlSpeciesDate,
                          hint: 'Species Date',
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
                        AppFormField(
                          labelText: 'Average Weight',
                          keyboardType: TextInputType.number,
                          controller: _ctrlWeight,
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
