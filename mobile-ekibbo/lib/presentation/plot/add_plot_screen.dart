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
import 'package:agrobase_ekibbo/components/input/input_next_data.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/map_toolkit_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_address.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/presentation/farmer_list/views/screen_search_farmer.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

class AddPlotScreen extends StatefulWidget {
  const AddPlotScreen({
    super.key,
    this.farmer,
    this.farmland,
  });
  final FarmerModel? farmer;
  final FarmLandModel? farmland;

  @override
  State<AddPlotScreen> createState() => _AddPlotScreenState();
}

class _AddPlotScreenState extends State<AddPlotScreen> {
  final farmLandModel = FarmLandModel();
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
  String _farmerError = '';
  String initValueFarmer = '';
  int farmerId = 0;

  int? _ownerIndex;
  int? _approachIndex;
  int? _topologIndex;
  int? _gradientIndex;
  String? _errorLandOwner;

  @override
  void initState() {
    _getDropdDown();
    super.initState();
  }

  @override
  void dispose() {
    _areaTxtController.dispose();
    _farmNameTxtController.dispose();
    _totalLandTxtController.dispose();
    _farmImg = null;
    _landImg = null;
    NavigatorManager.contextRoot
        .read<AppProvider>()
        .updateState(AppEvent.appSearchResetData);
    super.dispose();
  }

  _getDropdDown() async {
    try {
      final res = await ApiAddress.getDropDownForFarmland();
      setState(() {
        _ownerLands = res.dataLandWwnerShip ?? [];
        _landGradients = res.dataLandGradient ?? [];
        _appoarchRoads = res.dataAppoarchRoad ?? [];
        _landTopologs = res.dataLandTopolog ?? [];
        if (widget.farmer != null) {
          initValueFarmer =
              widget.farmer == null ? '' : widget.farmer!.showInputName;
          farmerId = widget.farmer == null ? 0 : widget.farmer!.id!;
        }
        if (widget.farmland != null) {
          _setData();
        }
      });
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
    _gradientIndex =
        _landGradients.getIndex((p0) => p0.name == farmland.landGradient);
    _farmImg = farmland.farmPhoto != null ? XFile(farmland.farmPhoto!) : null;
    _landImg =
        farmland.landDocument != null ? XFile(farmland.landDocument!) : null;
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
    try {
      final isInternetAvailable = await CommonHelper.isInternetAvailable();
      if (isInternetAvailable) {
        if (!_formKey.currentState!.validate()) {
          return;
        }
        if (farmerId == 0) {
          DialogHelper.showOkDialog(
              context, AppLang.local.please_choose_farmer);
          return;
        }
        if (_ownerIndex == null) {
          setState(() {
            _errorLandOwner = 'Please choose land ownership!';
          });
          return;
        }
      }

      final listLatLng = points.map((e) => [e.latitude, e.longitude]).toList();
      final m = MapToolKitHelper.getArea(listLatLng);

      if (widget.farmland != null) farmLandModel.id = widget.farmland!.id;
      farmLandModel.farmerId = farmerId;
      farmLandModel.farmName = _farmNameTxtController.text;
      farmLandModel.totalLandHolding =
          double.tryParse(_totalLandTxtController.text) ?? 0;
      farmLandModel.actualArea = (m / 10000).toStringAsFixed(2);
      farmLandModel.farmPlottings = points
          .map((e) => FarmPlottingModel()
            ..lat = e.latitude.toString()
            ..lng = e.longitude.toString())
          .toList();
      farmLandModel.landOwnership = _ownerLands[_ownerIndex!].name;
      farmLandModel.approachRoad =
          _approachIndex != null ? _appoarchRoads[_approachIndex!].name : '';
      farmLandModel.landTopology =
          _topologIndex != null ? _landTopologs[_topologIndex!].name : '';
      farmLandModel.landGradient =
          _gradientIndex == null ? '' : _landGradients[_gradientIndex!].name;
      farmLandModel.farmPhoto = _farmImg?.path;
      farmLandModel.landDocument = _landImg?.path;
      farmLandModel.lat = DataConstant.lat.toString();
      farmLandModel.lng = DataConstant.lng.toString();
      farmLandModel.tag = widget.farmland?.tag ?? '';
      farmLandModel.listLatLng = listLatLng.toString();

      print(farmLandModel.toMap());
      // return;

      final form = FormData.fromMap(farmLandModel.toMap());
      if (isInternetAvailable) {
        form.files.addAll([
          if (_farmImg != null)
            MapEntry(
              'farm_photo[]',
              await MultipartFile.fromFile(
                farmLandModel.farmPhoto!,
                contentType: MediaType.parse(
                    lookupMimeType(farmLandModel.farmPhoto!) ?? ''),
              ),
            ),
          if (_landImg != null)
            MapEntry(
              'land_document[]',
              await MultipartFile.fromFile(
                farmLandModel.landDocument!,
                contentType: MediaType.parse(
                    lookupMimeType(farmLandModel.landDocument!) ?? ''),
              ),
            ),
        ]);
      }
      if (widget.farmland == null) {
        await _insert(form);
        return;
      }
      if (widget.farmland!.tag.startsWith('insert_')) {
        await _insert(form);
        return;
      }
      await _update(form);
    } catch (e) {
      DialogHelper.hideLoading();
      if (e is DioException) {
        if (e.type == DioExceptionType.badResponse) {
          DialogHelper.showOkDialog(context, e.response?.data['message'] ?? '');
        } else if (e.type == DioExceptionType.connectionError) {
          context.read<AppProvider>().updateStateFuture(AppEvent.appPondSaveToLocal,
              argument: farmLandModel);
          Navigator.of(context).pop();
          DialogHelper.showToast(context, 'The plot has been saved locally!');
        } else {
          DialogHelper.showOkDialog(
              context, 'An unexpected error occurred: $e');
        }
      } else {
        DialogHelper.showOkDialog(context, 'An error occurred: $e');
      }
    }
  }

  _insert(FormData form) async {
    DialogHelper.showLoading();
    final res = await ApiProvider.instance.apiFarmland.addFarmLand(form);
    DialogHelper.hideLoading();
    if (res?.result == true) {
      context.read<AppProvider>().updateStateFuture(AppEvent.appPondDeleteFromLocal,
          argument: farmLandModel.id.toString());
      Navigator.of(context).pop(true);
      DialogHelper.showToast(context, 'Add plot successfully!');
    }
  }

  _update(FormData form) async {
    DialogHelper.showLoading();
    final res = await ApiProvider.instance.apiFarmland
        .updateFarmland(form, widget.farmland!.id!);
    DialogHelper.hideLoading();
    if (res?.result == true) {
      context.read<AppProvider>().updateStateFuture(AppEvent.appPondDeleteFromLocal,
          argument: farmLandModel.id.toString());
      Navigator.of(context).pop(true);
      DialogHelper.showToast(context, 'Update plot successfully!');
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: CustomAppBar(
          title: AppLang.local.add_plot,
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
                        InputNextData(
                          hintText: "${AppLang.local.farmer} *",
                          errorText: _farmerError,
                          initValue: initValueFarmer,
                          onChange: () async {
                            if (widget.farmland != null &&
                                widget.farmland!.tag.isEmpty) return;
                            final res = await Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) => ScreenSearchFarmer(
                                  argument: ArgumentScreenSearchFarmer(
                                    farmerSelected: initValueFarmer,
                                  ),
                                ),
                              ),
                            );
                            if (res is ArgumentScreenSearchFarmer) {
                              initValueFarmer = res.farmerSelected;
                              farmerId = res.farmerId;
                              _farmerError = '';
                              setState(() {});
                            }
                          },
                        ),
                        const SizedBox(
                          height: 24,
                        ),
                        AppFormField(
                          labelText: '${AppLang.local.field_name} *',
                          controller: _farmNameTxtController,
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
                          controller: _totalLandTxtController,
                          hint: '${AppLang.local.total_land_holding} *',
                          keyboardType: TextInputType.number,
                          suffixIcon: Padding(
                            padding: const EdgeInsets.only(top: 16, bottom: 16),
                            child: Text(
                              'ha',
                              style: TextStyleConstant.quicksandW600(
                                color: ColorConstant.text79.withOpacity(0.3),
                              ),
                            ),
                          ),
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppLang.local.please_fill_total_land;
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
                                      '${AppLang.local.farm_land_plotting} *',
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
                          readOnly: true,
                          controller: _areaTxtController,
                          labelText: AppLang.local.total_plot_area,
                          fillColor: ColorConstant.grayDBDBDB,
                          suffixIcon: Padding(
                            padding: const EdgeInsets.only(top: 16, bottom: 16),
                            child: Text(
                              'ha',
                              style: TextStyleConstant.quicksandW600(
                                color: ColorConstant.text79,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(
                          height: 24,
                        ),
                        StatefulBuilder(
                          builder: (_, s) => _buildImgView(
                            AppLang.local.plots_photos,
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
                        AppDropdownButton(
                          hintText: '${AppLang.local.land_ownership} *',
                          items: _ownerLands.map((e) => e.name ?? '').toList(),
                          itemSelected: _ownerIndex == null
                              ? ''
                              : _ownerLands[_ownerIndex!].name,
                          onChanged: (v) {
                            setState(() {
                              _ownerIndex = v;
                            });
                          },
                          error: _errorLandOwner,
                        ),
                        const SizedBox(
                          height: 24,
                        ),
                        AppDropdownButton(
                          hintText: AppLang.local.approach_road,
                          items: _appoarchRoads.map((e) => e.name!).toList(),
                          itemSelected: _approachIndex == null
                              ? ''
                              : _appoarchRoads[_approachIndex!].name,
                          onChanged: (v) {
                            setState(() {
                              _approachIndex = v;
                            });
                          },
                        ),
                        const SizedBox(
                          height: 24,
                        ),
                        AppDropdownButton(
                          hintText: AppLang.local.land_topology,
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
                        AppDropdownButton(
                          hintText: AppLang.local.land_gradient,
                          items: _landGradients.map((e) => e.name!).toList(),
                          itemSelected: _gradientIndex == null
                              ? ''
                              : _landGradients[_gradientIndex!].name,
                          onChanged: (v) {
                            setState(() {
                              _gradientIndex = v;
                            });
                          },
                        ),
                        const SizedBox(
                          height: 24,
                        ),
                        StatefulBuilder(
                          builder: (_, s) => _buildImgView(
                            AppLang.local.land_document,
                            url: widget.farmland?.landDocument,
                            img: _landImg,
                            chooseImg: () async {
                              _landImg = await CommonHelper.chooseImg();
                              s(() {});
                            },
                          ),
                        )
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
                  onTap: _onSubmit,
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



    // final data = {
    //   'farmer': farmerId,
    //   'farm_name': _farmNameTxtController.text,
    //   'total_land_holding':
    //       (double.tryParse(_totalLandTxtController.text) ?? 0),
    //   'lat': points.first.latitude,
    //   'lng': points.first.longitude,
    //   'farm_land_ploting': '',
    //   'actual_area': (m / 10000).toStringAsFixed(2),
    //   'land_ownership': _ownerLands[_ownerIndex!].name,
    //   'srp_score': '',
    //   'carbon_index': '',
    //   'approach_road':
    //       _approachIndex != null ? _appoarchRoads[_approachIndex!].name : '',
    //   'land_topology':
    //       _topologIndex != null ? _landTopologs[_topologIndex!].name : '',
    //   'land_gradient':
    //       _gradientIndex == null ? '' : _landGradients[_gradientIndex!].name,
    //   'list_lat_lng': listLatLng.toString(),
    //   'staff_lat': DataConstant.lat,
    //   'staff_lng': DataConstant.lng,
    // };
