// ignore_for_file: use_build_context_synchronously

import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
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
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/map_toolkit_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

class PondRegScreen extends StatefulWidget {
  const PondRegScreen({
    super.key,
    this.farmer,
    this.farmland,
  });
  final FarmerModel? farmer;
  final FarmLandModel? farmland;

  @override
  State<PondRegScreen> createState() => _PondRegScreenState();
}

class _PondRegScreenState extends State<PondRegScreen> {
  List<LatLng> points = [];
  final _areaTxtController = TextEditingController();
  final _farmNameTxtController = TextEditingController();
  final _totalLandTxtController = TextEditingController();
  XFile? _farmImg;
  XFile? _landImg;
  final _formKey = GlobalKey<FormState>();
  List<DropdownDataModel> _ownerLands = [];
  List<DropdownDataModel> _landGradients = [];
  List<DropdownDataModel> _appoarchRoads = [];
  List<DropdownDataModel> _landTopologs = [];
  String initValueFarmer = '';
  int farmerId = 0;

  int? _ownerIndex;
  int? _approachIndex;
  int? _topologIndex;
  int? _gradientIndex;
  //String? _errorLandOwner;

  @override
  void initState() {
    //_getDropdDown();
    super.initState();
  }

  @override
  void dispose() {
    _areaTxtController.dispose();
    _farmNameTxtController.dispose();
    _totalLandTxtController.dispose();
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

  _getDropdDown() async {
    try {
      final res =
          await ApiProvider.instance.apiFarmland.getFarmLandDropdownData();
      if (res?.data != null) {
        setState(() {
          _ownerLands = res!.data!.dataLandWwnerShip ?? [];
          _landGradients = res.data!.dataLandGradient ?? [];
          _appoarchRoads = res.data?.dataAppoarchRoad ?? [];
          _landTopologs = res.data?.dataLandTopolog ?? [];
          if (widget.farmer != null) {
            initValueFarmer =
                widget.farmer == null ? '' : widget.farmer!.showInputName;
            farmerId = widget.farmer == null ? 0 : widget.farmer!.id!;
          }
          if (widget.farmland != null) {
            _setData();
          }
        });
      }
    } catch (_) {
      print(_);
    }
  }

  _setData() {
    final farmland = widget.farmland!;
    _farmNameTxtController.text = farmland.farmName ?? '';
    _totalLandTxtController.text = '${farmland.totalLandHolding ?? ''}';
    points = (farmland.farmPlottings ?? [])
        .map((e) => LatLng(
              double.parse(e.lat ?? '0'),
              double.parse(e.lng ?? '0'),
            ))
        .toList();
    _areaTxtController.text = '${farmland.actualArea ?? 0}';
    _ownerIndex =
        _ownerLands.getIndex((p0) => p0.name == farmland.landOwnership);
    _approachIndex =
        _appoarchRoads.getIndex((p0) => p0.name == farmland.approachRoad);
    _topologIndex =
        _landTopologs.getIndex((p0) => p0.name == farmland.landTopology);
  }

  _addPlotting() {
    Navigator.of(context).pushNamed(
      RouterName.farm_land_plotting,
      arguments: {'points': points},
    ).then((value) {
      if (value != null && value is List<LatLng>) {
        setState(() {
          points = value;
        });
        final areaMeters = MapToolKitHelper.getArea(
            points.map((e) => [e.latitude, e.longitude]).toList());
        _areaTxtController.text = (areaMeters / 10000).toStringAsFixed(2);
      }
    });
  }

  _onSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    if (farmerId == 0) {
      DialogHelper.showOkDialog(context, AppLang.local.please_choose_farmer);
      return;
    }
    if (points.isEmpty) {
      DialogHelper.showOkDialog(
          context, AppLang.local.please_fill_land_plotting);
      return;
    }
    // if (_ownerIndex == null) {
    //   setState(() {
    //     _errorLandOwner = 'Please choose land ownership!';
    //   });
    //   return;
    // }

    final listLatLng = points.map((e) => [e.latitude, e.longitude]).toList();
    final m = MapToolKitHelper.getArea(listLatLng);
    final data = {
      'farmer': farmerId,
      'farm_name': _farmNameTxtController.text,
      'total_land_holding':
          (double.tryParse(_totalLandTxtController.text) ?? 0),
      'lat': points.first.latitude,
      'lng': points.first.longitude,
      'farm_land_ploting': '',
      'actual_area': (m / 10000).toStringAsFixed(2),
      'land_ownership': _ownerLands[_ownerIndex!].name,
      'srp_score': '',
      'carbon_index': '',
      'approach_road':
          _approachIndex != null ? _appoarchRoads[_approachIndex!].name : '',
      'land_topology':
          _topologIndex != null ? _landTopologs[_topologIndex!].name : '',
      'land_gradient':
          _gradientIndex == null ? '' : _landGradients[_gradientIndex!].name,
      'list_lat_lng': listLatLng.toString(),
      'staff_lat': DataConstant.lat,
      'staff_lng': DataConstant.lng,
    };

    var form = FormData.fromMap(
      data,
    );

    form.files.addAll([
      if (_farmImg != null)
        MapEntry(
          'farm_photo[]',
          MultipartFile.fromFileSync(
            _farmImg!.path,
            contentType: MediaType.parse(lookupMimeType(_farmImg!.path) ?? ''),
          ),
        ),
      if (_landImg != null)
        MapEntry(
          'land_document[]',
          MultipartFile.fromFileSync(
            _landImg!.path,
            contentType: MediaType.parse(lookupMimeType(_farmImg!.path) ?? ''),
          ),
        ),
    ]);
    if (widget.farmland != null) {
      _update(form);
      return;
    }
    try {
      DialogHelper.showLoading();
      final res = await ApiProvider.instance.apiFarmland.addFarmLand(form);
      if (res?.result == true) {
        Navigator.of(context).pop(true);
        DialogHelper.showToast(context, 'Add plot successfully!');
      }
      DialogHelper.hideLoading();
    } catch (_) {
      DialogHelper.hideLoading();
    }
  }

  _update(FormData form) async {
    try {
      DialogHelper.showLoading();
      final res = await ApiProvider.instance.apiFarmland
          .updateFarmland(form, widget.farmland!.id!);
      DialogHelper.hideLoading();
      if (res?.result == true) {
        Navigator.of(context).pop(true);
        DialogHelper.showToast(context, 'Update plot successfully!');
      }
    } catch (_) {
      DialogHelper.hideLoading();
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: const CustomAppBar(
          title: "Pond Reg",
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
                          labelText: 'Pond Name *',
                          //controller: _farmNameTxtController,
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
                          labelText: 'Pond Identification Number',
                          //controller: _farmNameTxtController,
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
                        InkWell(
                          onTap: _addPlotting,
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              color: ColorConstant.grayF6F7F9,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Pond Area *',
                                      style: TextStyleConstant.quicksandW600(
                                        color: ColorConstant.text79,
                                      ),
                                    ),
                                    SvgPicture.asset(
                                      'ic_plus_bold'.iconSvg,
                                    )
                                  ],
                                ),
                                for (var i = 0; i < points.length; i++)
                                  _buildLatLngText(
                                    i,
                                    points[i],
                                  )
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(
                          height: 24,
                        ),
                        AppFormField(
                          labelText: 'Pond Depth',
                          //controller: _farmNameTxtController,
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
                          labelText: 'Water Spread Area',
                          //controller: _farmNameTxtController,
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
                        AppDropdownButton(
                          hintText: "Farming Approach",
                          items: _landTopologs.map((e) => e.name!).toList(),
                          itemSelected: _topologIndex == null
                              ? ''
                              : _landTopologs[_topologIndex!].name,
                          onChanged: (v) {
                            setState(() {
                              _topologIndex = v;
                            });
                          },
                        ),
                        const SizedBox(
                          height: 24,
                        ),
                        StatefulBuilder(
                          builder: (_, s) => _buildImgView(
                            'Photo',
                            url: widget.farmland?.farmPhoto,
                            chooseImg: () async {
                              _farmImg = await CommonHelper.chooseImg();
                              s(() {});
                            },
                            img: _farmImg,
                          ),
                        ),
                        const SizedBox(
                          height: 24,
                        ),
                        AppFormField(
                          labelText: 'Remarks ',
                          //controller: _farmNameTxtController,
                          maxLines: 5,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_field_name;
                            }
                            return null;
                          },
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
                    //_onSubmit
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

  Padding _buildLatLngText(
    int index,
    LatLng latlng,
  ) {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: RichText(
        text: TextSpan(
          children: [
            TextSpan(
              text: 'Point ${index + 1}: ',
              style: TextStyleConstant.robotoW700(
                fontSize: 12,
                color: ColorConstant.text79,
              ),
            ),
            TextSpan(
              text:
                  '(${AppLang.local.latitude}) ${latlng.latitude} | (${AppLang.local.longtitude}) ${latlng.longitude}',
              style: TextStyleConstant.robotoW400(
                fontSize: 12,
                color: ColorConstant.text79,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
