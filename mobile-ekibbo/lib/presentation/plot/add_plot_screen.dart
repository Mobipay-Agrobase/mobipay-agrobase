// ignore_for_file: use_build_context_synchronously

import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/map_view.dart';
import 'package:agrobase_ekibbo/components/input/input_next_data.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/map_toolkit_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_address.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_farmland.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/presentation/farmer_list/views/screen_search_farmer.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/domain/config/farm_plant_catalog.dart';
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
  final _formKey = GlobalKey<FormState>();
  // UAT (plant type details): conventional crops grown on the plot — web
  // FarmLandFormPage parity (free text, e.g. "Maize, Beans").
  final _conventionalCropsController = TextEditingController();
  // Second review (G-vii): ownership options hardcoded
  static const List<String> _ownershipOptions = [
    'Rented/leased',
    'Sales agreement',
    'Inherited',
    'Family owned',
    'Communal owned',
  ];
  // Second review (G-v): neighbouring physical features (replaces typology)
  static const List<String> _featureOptions = [
    'Rivers', 'Lakes', 'Swamp', 'Forest', 'Natural forest', 'Planted forest',
    'Valley', 'Hill/mountain', 'Game park/Game reserve',
  ];
  final Set<String> _selectedFeatures = {};
  // Second review (G-ix): access map point (replaces approach road)
  LatLng? _accessMapPoint;
  List<DropdownDataModel> _soilFertility = [];
  List<DropdownDataModel> _irrigationTypes = [];
  int? _fertilityIndex, _irrigationIndex;
  final _estYieldTxtController = TextEditingController();
  final _fullTimeTxtController = TextEditingController();
  final _partTimeTxtController = TextEditingController();
  final _seasonalTxtController = TextEditingController();
  final _familyTxtController = TextEditingController();
  String _farmerError = '';
  String initValueFarmer = '';
  int farmerId = 0;

  int? _ownerIndex;
  String? _errorLandOwner;

  // ── UAT: plant inventory rows ("add plant type details" at plot
  // registration). Categories/varieties come from FarmPlantCatalog — the
  // same fixed review-H list the web Plants tab uses (Coffee–Robusta,
  // Cocoa–Trinitario/…, Shade Trees species, …). Rows are optional; the
  // backend creates FarmPlant records together with the farm land.
  final List<_PlantRowEntry> _plantRows = [];

  void _addPlantRow() => setState(() => _plantRows.add(_PlantRowEntry()));

  void _removePlantRow(int index) {
    setState(() {
      _plantRows[index].dispose();
      _plantRows.removeAt(index);
    });
  }

  @override
  void initState() {
    _getDropdDown();
    super.initState();
  }

  @override
  void dispose() {
    for (final row in _plantRows) {
      row.dispose();
    }
    _conventionalCropsController.dispose();
    _estYieldTxtController.dispose();
    _fullTimeTxtController.dispose();
    _partTimeTxtController.dispose();
    _seasonalTxtController.dispose();
    _familyTxtController.dispose();
    _areaTxtController.dispose();
    _farmNameTxtController.dispose();
    _totalLandTxtController.dispose();
    NavigatorManager.contextRoot
        .read<AppProvider>()
        .updateState(AppEvent.appSearchResetData);
    super.dispose();
  }

  _getDropdDown() async {
    try {
      final res = await ApiFarmland.getEkibboFarmlandDropdowns();
      if (!mounted) return;
      setState(() {
        // Second review (G): removed fields no longer loaded
        _soilFertility = res.dataSoilFertility ?? [];
        _irrigationTypes = res.dataIrrigationType ?? [];
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
    _ownerIndex = _ownershipOptions.indexOf(farmland.landOwnership ?? '');
    if (_ownerIndex == -1) _ownerIndex = null;
    // UAT (plant type details): restore conventional crops in edit mode.
    _conventionalCropsController.text = farmland.conventionalCrops ?? '';
    // Second review (G): neighbouring features + access map
    if (farmland.neighbouringFeatures != null) {
      try {
        final list = farmland.neighbouringFeatures!.split(',');
        _selectedFeatures.addAll(list.map((e) => e.trim()).where((e) => e.isNotEmpty));
      } catch (_) {}
    }
    final lat = double.tryParse(farmland.accessMapLat ?? '');
    final lng = double.tryParse(farmland.accessMapLng ?? '');
    if (lat != null && lng != null) _accessMapPoint = LatLng(lat, lng);
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

  // ── UAT (plant type details): Plant Inventory section ─────────────────
  /// Optional rows of plant types on this plot (Coffee–Robusta, Cocoa–
  /// Trinitario, Shade Trees, …). Same catalog as the Plot Detail Plants
  /// tab; rows submitted with the plot are created server-side in one shot.
  /// On EDIT the section is hidden — existing plant rows are managed from
  /// the Plot Detail → Plants tab (add/delete) to avoid duplicates.
  Widget _buildPlantInventorySection() {
    final isCreate =
        widget.farmland == null || widget.farmland!.tag.startsWith('insert_');
    if (!isCreate) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Plant Type Details',
                style: TextStyleConstant.quicksandW600(
                  color: ColorConstant.text79,
                ),
              ),
            ),
            InkWell(
              onTap: _addPlantRow,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  color: ColorConstant.primary.withOpacity(0.1),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SvgPicture.asset('ic_plus_bold'.iconSvg,
                        height: 14, width: 14),
                    const SizedBox(width: 6),
                    Text(
                      'Add Plant Type',
                      style: TextStyleConstant.robotoW600(
                        fontSize: 12,
                        color: ColorConstant.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'Optional — crops/trees planted on this plot (feeds the Total Plants registry). You can add or edit them later from Plot Details → Plants.',
          style: TextStyleConstant.robotoW400(
            fontSize: 11,
            color: ColorConstant.text79.withOpacity(0.7),
          ),
        ),
        const SizedBox(height: 12),
        if (_plantRows.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              color: ColorConstant.grayF6F7F9,
            ),
            child: Text(
              'No plant types added yet.',
              style: TextStyleConstant.robotoW400(
                fontSize: 12,
                color: ColorConstant.text79.withOpacity(0.7),
              ),
            ),
          )
        else
          for (var i = 0; i < _plantRows.length; i++) _buildPlantRow(i),
      ],
    );
  }

  Widget _buildPlantRow(int index) {
    final row = _plantRows[index];
    final categories = FarmPlantCatalog.categories.keys.toList();
    final varieties =
        row.category == null ? <String>[] : FarmPlantCatalog.varietiesFor(row.category!);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: ColorConstant.grayDBDBDB),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Plant Type ${index + 1}',
                  style: TextStyleConstant.quicksandW600(
                    fontSize: 12,
                    color: ColorConstant.text79,
                  ),
                ),
              ),
              InkWell(
                onTap: () => _removePlantRow(index),
                child: const Icon(Icons.delete_outline,
                    size: 20, color: Colors.redAccent),
              ),
            ],
          ),
          const SizedBox(height: 12),
          AppDropdownButton(
            hintText: 'Crop / Tree Category *',
            items: categories,
            itemSelected: row.category ?? '',
            onChanged: (v) => setState(() {
              // AppDropdownButton returns the item INDEX — map back to value.
              row.category = categories.isNotEmpty && v < categories.length
                  ? categories[v]
                  : null;
              // Reset variety when the category changes (dependent list).
              row.variety = null;
            }),
          ),
          if (varieties.isNotEmpty) ...[
            const SizedBox(height: 12),
            AppDropdownButton(
              hintText: 'Variety',
              items: varieties,
              itemSelected: row.variety ?? '',
              onChanged: (v) => setState(() {
                row.variety =
                    varieties.isNotEmpty && v < varieties.length
                        ? varieties[v]
                        : null;
              }),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: AppFormField(
                  labelText: 'Plant Count *',
                  controller: row.countController,
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 3,
                child: AppFormField(
                  labelText: 'Notes (optional)',
                  controller: row.notesController,
                ),
              ),
            ],
          ),
        ],
      ),
    );
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
      farmLandModel.landOwnership =
          _ownerIndex != null ? _ownershipOptions[_ownerIndex!] : '';
      // Second review (G): neighbouring features (JSON array) + access map
      farmLandModel.neighbouringFeatures =
          _selectedFeatures.isEmpty ? '' : _selectedFeatures.toList().join(', ');
      farmLandModel.accessMapLat = _accessMapPoint?.latitude.toString();
      farmLandModel.accessMapLng = _accessMapPoint?.longitude.toString();
      farmLandModel.soilFertility =
          _fertilityIndex == null ? '' : _soilFertility[_fertilityIndex!].name ?? '';
      farmLandModel.irrigationType =
          _irrigationIndex == null ? '' : _irrigationTypes[_irrigationIndex!].name ?? '';
      farmLandModel.estYield = _estYieldTxtController.text;
      farmLandModel.fullTimeWorkers = _fullTimeTxtController.text;
      farmLandModel.partTimeWorkers = _partTimeTxtController.text;
      farmLandModel.seasonalWorkers = _seasonalTxtController.text;
      farmLandModel.familyWorkers = _familyTxtController.text;
      // UAT (plant type details): conventional crops grown on this plot.
      farmLandModel.conventionalCrops = _conventionalCropsController.text;
      farmLandModel.lat = DataConstant.lat.toString();
      farmLandModel.lng = DataConstant.lng.toString();
      farmLandModel.tag = widget.farmland?.tag ?? '';
      farmLandModel.listLatLng = listLatLng.toString();

      // Second review (G): farm photo + land document uploads removed —
      // the polygon (farm land plotting) is the land record.
      final form = FormData.fromMap(farmLandModel.toMap());

      // UAT (plant type details): plant inventory rows ride along with the
      // same multipart flattening pattern Dio uses for farm_plottings
      // (`plants[i][crop_category]`, `plants[i][variety]`, …) — the backend
      // reassembles them and creates the FarmPlant records in one shot.
      // Only on CREATE: updates manage plants via the Plot Detail Plants tab.
      final isCreate = widget.farmland == null ||
          widget.farmland!.tag.startsWith('insert_');
      if (isCreate) {
        var plantIdx = 0;
        for (final row in _plantRows) {
          final category = row.category;
          if (category == null || category.isEmpty) continue;
          final count = int.tryParse(row.countController.text.trim()) ?? 0;
          if (count <= 0) continue;
          form.fields.add(MapEntry('plants[$plantIdx][crop_category]', category));
          if (row.variety != null && row.variety!.isNotEmpty) {
            form.fields.add(MapEntry('plants[$plantIdx][variety]', row.variety!));
          }
          form.fields.add(MapEntry('plants[$plantIdx][plant_count]', '$count'));
          final notes = row.notesController.text.trim();
          if (notes.isNotEmpty) {
            form.fields.add(MapEntry('plants[$plantIdx][notes]', notes));
          }
          plantIdx++;
        }
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
                        // Second review (G-vii): ownership — 5 options
                        AppDropdownButton(
                          hintText: '${AppLang.local.land_ownership} *',
                          items: _ownershipOptions.toList(),
                          itemSelected: _ownerIndex == null
                              ? ''
                              : _ownershipOptions[_ownerIndex!],
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
                        // ── Second review (G-v): neighbouring physical features ──
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Neighbouring Physical Features',
                            style: TextStyleConstant.worksansW500(
                              color: ColorConstant.gray6C757D,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _featureOptions
                              .map((f) => ChoiceChip(
                                    label: Text(f),
                                    selected: _selectedFeatures.contains(f),
                                    onSelected: (sel) {
                                      setState(() {
                                        if (sel) {
                                          _selectedFeatures.add(f);
                                        } else {
                                          _selectedFeatures.remove(f);
                                        }
                                      });
                                    },
                                  ))
                              .toList(),
                        ),
                        const SizedBox(
                          height: 24,
                        ),
                        // ── Second review (G-ix): access map (replaces approach road) ──
                        InkWell(
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => MapView(latLng: _accessMapPoint),
                            ),
                          ).then((value) {
                            if (value != null && value is LatLng) {
                              setState(() {
                                _accessMapPoint = value;
                              });
                            }
                          }),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              GImage.asset(
                                name: 'map'.imgPNG,
                                height: 50,
                                width: 50,
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Access Map',
                                      style: TextStyleConstant.worksansW500(
                                        color: ColorConstant.text79,
                                      ),
                                    ),
                                    if (_accessMapPoint != null)
                                      Text(
                                        '${_accessMapPoint!.latitude}, ${_accessMapPoint!.longitude}',
                                        style:
                                            TextStyleConstant.robotoW400(
                                                fontSize: 12,
                                                color: ColorConstant.text79),
                                      )
                                    else
                                      Text(
                                        'You can choose on map',
                                        style:
                                            TextStyleConstant.robotoW400(
                                                fontSize: 12,
                                                color: ColorConstant.text79),
                                      ),
                                  ],
                                ),
                              )
                            ],
                          ),
                        ),
                        const SizedBox(
                          height: 24,
                        ),
                        AppDropdownButton(
                          hintText: 'Fertility Status',
                          items: _soilFertility.map((e) => e.name ?? '').toList(),
                          itemSelected: _fertilityIndex == null ? '' : _soilFertility[_fertilityIndex!].name ?? '',
                          onChanged: (v) => setState(() => _fertilityIndex = v),
                        ),
                        const SizedBox(height: 24),
                        AppDropdownButton(
                          hintText: 'Irrigation Type',
                          items: _irrigationTypes.map((e) => e.name ?? '').toList(),
                          itemSelected: _irrigationIndex == null ? '' : _irrigationTypes[_irrigationIndex!].name ?? '',
                          onChanged: (v) => setState(() => _irrigationIndex = v),
                        ),
                        const SizedBox(height: 24),
                        AppFormField(
                          labelText: 'Est Yield (Kg)',
                          controller: _estYieldTxtController,
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Expanded(child: AppFormField(
                              labelText: 'Full-time Workers',
                              controller: _fullTimeTxtController,
                              keyboardType: TextInputType.number,
                            )),
                            const SizedBox(width: 12),
                            Expanded(child: AppFormField(
                              labelText: 'Part-time Workers',
                              controller: _partTimeTxtController,
                              keyboardType: TextInputType.number,
                            )),
                          ],
                        ),
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Expanded(child: AppFormField(
                              labelText: 'Seasonal Workers',
                              controller: _seasonalTxtController,
                              keyboardType: TextInputType.number,
                            )),
                            const SizedBox(width: 12),
                            Expanded(child: AppFormField(
                              labelText: 'Family Workers',
                              controller: _familyTxtController,
                              keyboardType: TextInputType.number,
                            )),
                          ],
                        ),
                        const SizedBox(height: 24),
                        // ── UAT (plant type details): conventional crops + plant
                        // inventory at plot registration (web FarmLandFormPage
                        // parity; rows feed the Farm Plant Registry KPI).
                        AppFormField(
                          labelText: 'Conventional Crops',
                          controller: _conventionalCropsController,
                          hint: 'e.g. Maize, Beans',
                        ),
                        const SizedBox(height: 24),
                        _buildPlantInventorySection(),
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

/// UAT (plant type details): one editable plant-inventory row in the Add
/// Plot screen. Category/variety come from FarmPlantCatalog; the row is
/// appended to the multipart submit as `plants[i][crop_category]` etc. and
/// the backend creates the FarmPlant records with the farm land in one
/// transaction-style flow.
class _PlantRowEntry {
  String? category;
  String? variety;
  final countController = TextEditingController();
  final notesController = TextEditingController();

  void dispose() {
    countController.dispose();
    notesController.dispose();
  }
}

