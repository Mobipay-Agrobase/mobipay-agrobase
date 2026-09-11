// ignore_for_file: use_build_context_synchronously

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_toast.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/persistent_header.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/config/farm_plant_catalog.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/domain/roles/role_config.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/user_info.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/models/farm_plant/farm_plant_model.dart';
import 'package:agrobase_ekibbo/models/information/species_response.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/widgets/menu_tab_view.dart';
import 'package:agrobase_ekibbo/presentation/information/species/widgets/species_item.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class PlotDetailScreen extends StatefulWidget {
  const PlotDetailScreen({
    super.key,
    required this.farmer,
    required this.plot,
  });
  final FarmerModel farmer;
  final FarmLandModel plot;
  @override
  State<PlotDetailScreen> createState() => _PlotDetailScreenState();
}

class _PlotDetailScreenState extends State<PlotDetailScreen> {
  FarmLandModel? _farmland;
  int _tabIndex = 0;

  final List<SpeciesInfoResponse> _species = [];

  // Second review (H): per-farm plant inventory (Coffee–Robusta, Cocoa
  // varieties, Vanilla, Shade Trees, Bananas, Jackfruit, Avocado, Cassava)
  final List<FarmPlantModel> _plants = [];
  bool _plantsLoading = false;

  @override
  void initState() {
    _getFarmlandDetail();
    _getSpecies();
    _getPlants();
    super.initState();
  }

  Future<void> _getFarmlandDetail() async {
    final res = await ApiProvider.instance.apiFarmland
        .getDetailFarmland(widget.plot.id!);
    if (res?.data != null) {
      setState(() {
        _farmland = res!.data!.farmLandData;
        _farmland?.farmPlottings = res.data?.farmLandPloting ?? [];
      });
    }
  }

  _getSpecies() async {
    final res = await ApiProvider.instance.apiSpecies.fetch(
      widget.farmer.id.toString(),
      widget.plot.id.toString(),
    );
    if (res?.data != null) {
      setState(() {
        _species.clear();
        _species.addAll(res!.data!);
      });
    }
  }

  /// Second review (H): load the plant inventory rows for this farm.
  Future<void> _getPlants() async {
    setState(() => _plantsLoading = true);
    try {
      final res = await ApiProvider.instance.apiFarmPlant
          .getFarmPlants(widget.plot.id!);
      setState(() {
        _plants.clear();
        _plants.addAll(res?.data ?? []);
        _plantsLoading = false;
      });
    } catch (e) {
      debugPrint(e.toString());
      setState(() => _plantsLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: '${AppLang.local.plot}: ${_farmland?.farmName}',
        subTitle: RichText(
          text: TextSpan(
            children: [
              TextSpan(
                text: '${AppLang.local.farmer}: ',
                style: TextStyleConstant.quicksandW700(
                  fontSize: 12,
                  color: ColorConstant.text79,
                ),
              ),
              TextSpan(
                text: widget.farmer.fullName,
                style: TextStyleConstant.quicksandW400(
                  fontSize: 12,
                  color: ColorConstant.text79,
                ),
              ),
            ],
          ),
        ),
        actions: [
          (DUserInfo.instance.user!.roleUser == EnumUserRole.staff)
              ? IconButton(
                  icon: const Icon(
                    Icons.edit,
                    color: ColorConstant.primary,
                  ),
                  onPressed: () async {
                    Navigator.of(context).pushNamed(RouterName.add_plot,
                        arguments: {
                          'farmland': _farmland,
                          'farmer': widget.farmer
                        }).then((value) {
                      if (value != null) {
                        _getFarmlandDetail();
                      }
                    });
                  },
                )
              : const SizedBox.shrink()
        ],
      ),
      body: _farmland == null
          ? const AppCircularIndicator()
          : RefreshIndicator(
              color: ColorConstant.primary,
              onRefresh: _getFarmlandDetail,
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                    child: Center(
                      child: Container(
                        height: 80,
                        width: 80,
                        margin: const EdgeInsets.only(top: 30, bottom: 15),
                        // color: Colors.red,
                        child: Stack(
                          children: [
                            const Positioned(
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              child: CircularProgressIndicator(
                                value: 0.7,
                                strokeWidth: 8,
                                backgroundColor: ColorConstant.greyEBEBEB,
                                color: ColorConstant.primary,
                              ),
                            ),
                            Center(
                              child: Text(
                                '70%',
                                style: TextStyleConstant.robotoW400(
                                  fontSize: 12,
                                  color: ColorConstant.text79,
                                ),
                              ),
                            )
                          ],
                        ),
                      ),
                    ),
                  ),
                  SliverPersistentHeader(
                    pinned: true,
                    floating: true,
                    delegate: PersistentHeader(
                      widget: MenuTabView(
                        isEqual: true,
                        datas: [
                          AppLang.local.detail,
                          AppLang.local.crops,
                          // Second review (H): plant inventory tab
                          'Plants',
                        ],
                        onChanged: (v) {
                          setState(() {
                            _tabIndex = v;
                          });
                        },
                      ),
                    ),
                  ),
                  SliverList(
                    delegate: SliverChildListDelegate(
                      [
                        _tabIndex == 0
                            ? _buildFarmInfo()
                            : _tabIndex == 1
                                ? _buildSpeciesList()
                                : _buildPlantsList(),
                      ],
                    ),
                  )
                ],
              ),
            ),
    );
  }

  Container _buildFarmInfo() {
    return Container(
      padding: const EdgeInsets.only(top: 25, left: 16, right: 16, bottom: 16),
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: ColorConstant.grayF7F8FA,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppLang.local.total_land_holding,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            '${_farmland!.totalLandHolding} ha',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.total_plot_area,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            '${_farmland!.actualArea} ha',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.land_ownership,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            _farmland!.landOwnership ?? '',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          // Second review (G): approach road/topology/gradient/land document
          // removed — show neighbouring features + access map instead.
          Text(
            'Neighbouring Physical Features',
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            _farmland!.neighbouringFeatures ?? '',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            'Access Map',
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            (_farmland!.accessMapLat != null && _farmland!.accessMapLng != null)
                ? '${_farmland!.accessMapLat}, ${_farmland!.accessMapLng}'
                : '',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.farm_land_plotting,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          GestureDetector(
            onTap: () => Navigator.of(context).pushNamed(
              RouterName.farm_land_plotting,
              arguments: {
                'is_enable': false,
                'points': (_farmland?.farmPlottings ?? [])
                    .map((e) => LatLng(
                          double.parse(e.lat ?? '0'),
                          double.parse(e.lng ?? '0'),
                        ))
                    .toList()
              },
            ),
            child: Text(
              'View farm land plotting',
              style: TextStyleConstant.robotoW400(color: ColorConstant.primary)
                  .copyWith(
                decoration: TextDecoration.underline,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpeciesList() {
    return _species.isEmpty
        ? const NoDataView()
        : ListView.builder(
            itemCount: _species.length,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            shrinkWrap: true,
            itemBuilder: (_, index) {
              final item = _species[index];
              return SpeciesItem(
                item: item,
                onUpdate: () {
                  Navigator.of(context).pushNamed(RouterName.add_species_info,
                      arguments: {'params': item}).then((value) {
                    if (value == null) return;
                    _getSpecies();
                  });
                },
              );
            });
  }

  // ── Second review (H): plant inventory tab ──────────────────────────────
  bool get _canManagePlants =>
      DUserInfo.instance.user?.roleUser == EnumUserRole.staff ||
      DUserInfo.instance.user?.roleUser == EnumUserRole.super_admin;

  Widget _buildPlantsList() {
    if (_plantsLoading) {
      return const Padding(
        padding: EdgeInsets.all(40),
        child: Center(child: AppCircularIndicator()),
      );
    }
    final totalPlants =
        _plants.fold<int>(0, (sum, p) => sum + (p.plantCount ?? 0));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(15),
            color: ColorConstant.grayF7F8FA,
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Plant Inventory',
                      style: TextStyleConstant.robotoW700(
                        fontSize: 16,
                        color: ColorConstant.text79,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$totalPlants plants recorded on this farm',
                      style: TextStyleConstant.robotoW400(
                        fontSize: 12,
                        color: ColorConstant.text79,
                      ),
                    ),
                  ],
                ),
              ),
              if (_canManagePlants)
                IconButton(
                  icon: const Icon(Icons.add_circle, color: ColorConstant.primary),
                  tooltip: 'Add plants',
                  onPressed: _showAddPlantDialog,
                ),
            ],
          ),
        ),
        if (_plants.isEmpty)
          const Padding(
            padding: EdgeInsets.all(24),
            child: NoDataView(),
          )
        else
          ListView.builder(
            itemCount: _plants.length,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            shrinkWrap: true,
            itemBuilder: (_, index) {
              final item = _plants[index];
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: ColorConstant.grayF7F8FA,
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.cropCategory ?? '',
                            style: TextStyleConstant.robotoW700(
                              fontSize: 16,
                              color: ColorConstant.text79,
                            ),
                          ),
                          if ((item.cropMasterName ?? '').isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: ColorConstant.primary.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'Crop Master: ${item.cropMasterName}',
                                style: TextStyleConstant.robotoW400(
                                  fontSize: 10,
                                  color: ColorConstant.primary,
                                ),
                              ),
                            ),
                          ],
                          if ((item.variety ?? '').isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              item.variety ?? '',
                              style: TextStyleConstant.robotoW400(
                                fontSize: 12,
                                color: ColorConstant.text79,
                              ),
                            ),
                          ],
                          if ((item.notes ?? '').isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              item.notes ?? '',
                              style: TextStyleConstant.robotoW400(
                                fontSize: 11,
                                color: ColorConstant.text79,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${item.plantCount ?? 0}',
                      style: TextStyleConstant.robotoW700(
                        fontSize: 18,
                        color: ColorConstant.primary,
                      ),
                    ),
                    if (_canManagePlants)
                      IconButton(
                        icon: const Icon(Icons.delete_outline,
                            color: Colors.redAccent),
                        tooltip: 'Delete',
                        onPressed: () => _deletePlant(item),
                      ),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }

  Future<void> _showAddPlantDialog() async {
    final categories = FarmPlantCatalog.categories.keys.toList();
    String? selectedCategory;
    String? selectedVariety;
    final countCtrl = TextEditingController();
    bool saving = false;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialog) => AlertDialog(
          title: const Text('Add Plants'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Crop Type',
                  style: TextStyleConstant.robotoW700(
                      fontSize: 14, color: ColorConstant.text79),
                ),
                const SizedBox(height: 8),
                AppDropdownButton(
                  hintText: 'Select crop type',
                  items: categories,
                  itemSelected: selectedCategory,
                  onChanged: (i) {
                    setDialog(() {
                      selectedCategory = categories[i];
                      selectedVariety = null; // reset dependent variety
                    });
                  },
                ),
                const SizedBox(height: 4),
                Text(
                  'Crop types are auto-linked to the Crop Master registry when a matching crop exists there.',
                  style: TextStyleConstant.robotoW400(
                    fontSize: 10,
                    color: ColorConstant.text79,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Variety',
                  style: TextStyleConstant.robotoW700(
                      fontSize: 14, color: ColorConstant.text79),
                ),
                const SizedBox(height: 8),
                AppDropdownButton(
                  hintText: (selectedCategory == null ||
                          FarmPlantCatalog.varietiesFor(selectedCategory!)
                              .isEmpty)
                      ? 'No varieties'
                      : 'Select variety',
                  items: selectedCategory == null
                      ? const []
                      : FarmPlantCatalog.varietiesFor(selectedCategory!),
                  itemSelected: selectedVariety,
                  isDisable: selectedCategory == null ||
                      FarmPlantCatalog.varietiesFor(selectedCategory!).isEmpty,
                  onChanged: (i) {
                    setDialog(() {
                      selectedVariety = FarmPlantCatalog.varietiesFor(
                          selectedCategory!)[i];
                    });
                  },
                ),
                const SizedBox(height: 16),
                Text(
                  'Plant Count',
                  style: TextStyleConstant.robotoW700(
                      fontSize: 14, color: ColorConstant.text79),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: countCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    hintText: 'e.g. 250',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: saving
                  ? null
                  : () async {
                      final count = int.tryParse(countCtrl.text.trim());
                      if (selectedCategory == null) {
                        AppToast.showDialog('Select a crop type');
                        return;
                      }
                      if (count == null || count < 0) {
                        AppToast.showDialog('Enter a valid plant count');
                        return;
                      }
                      setDialog(() => saving = true);
                      try {
                        final res = await ApiProvider
                            .instance.apiFarmPlant.addFarmPlant({
                          'farm_land_id': widget.plot.id.toString(),
                          'crop_category': selectedCategory,
                          'variety': selectedVariety,
                          'plant_count': count.toString(),
                        });
                        if (ctx.mounted) Navigator.of(ctx).pop();
                        if (res?.result == true) {
                          AppToast.showDialog('Plants added');
                          _getPlants();
                        } else {
                          AppToast.showDialog(
                              res?.message ?? 'Failed to save plants');
                        }
                      } catch (e) {
                        debugPrint(e.toString());
                        if (ctx.mounted) Navigator.of(ctx).pop();
                        AppToast.showDialog('Failed to save plants');
                      }
                    },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deletePlant(FarmPlantModel plant) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Plant Record'),
        content: Text(
            'Remove ${plant.cropCategory}${(plant.variety ?? '').isNotEmpty ? ' — ${plant.variety}' : ''} (${plant.plantCount ?? 0} plants)?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Delete')),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      final res = await ApiProvider.instance.apiFarmPlant
          .deleteFarmPlant(plant.id!);
      if (res?.result == true) {
        AppToast.showDialog('Plant record deleted');
        _getPlants();
      } else {
        AppToast.showDialog(res?.message ?? 'Failed to delete plant record');
      }
    } catch (e) {
      debugPrint(e.toString());
      AppToast.showDialog('Failed to delete plant record');
    }
  }

  Widget _buildListCrops() {
    return _farmland?.cultivation == null || _farmland!.cultivation!.isEmpty
        ? const NoDataView()
        : ListView.builder(
            itemCount: _farmland?.cultivation!.length,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            shrinkWrap: true,
            itemBuilder: (_, index) {
              final item = _farmland!.cultivation![index];
              return InkWell(
                onTap: () => Navigator.of(context)
                    .pushNamed(RouterName.crop_detail, arguments: item.id)
                    .then((value) {
                  _getFarmlandDetail();
                }),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.only(
                    top: 24,
                    left: 16,
                    right: 16,
                    bottom: 16,
                  ),
                  decoration: BoxDecoration(
                    color: ColorConstant.grayF7F8FA,
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        height: 48,
                        width: 48,
                        // color: Colors.red,
                        child: Stack(
                          children: [
                            const Positioned(
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              child: CircularProgressIndicator(
                                value: 0.7,
                                strokeWidth: 5,
                                backgroundColor: ColorConstant.greyEBEBEB,
                                color: ColorConstant.primary,
                              ),
                            ),
                            Center(
                              child: Text(
                                '70%',
                                style: TextStyleConstant.robotoW400(
                                  fontSize: 12,
                                  color: ColorConstant.text79,
                                ),
                              ),
                            )
                          ],
                        ),
                      ),
                      const SizedBox(
                        width: 13,
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  AppLang.local.crop_harvest,
                                  style: TextStyleConstant.robotoW700(
                                    fontSize: 16,
                                    color: ColorConstant.text79,
                                  ),
                                ),
                                // Second review (I): crop edit removed
                                const SizedBox.shrink()
                              ],
                            ),
                            const SizedBox(
                              height: 8,
                            ),
                            Text(
                              item.season?.seasonName ?? '',
                              style: TextStyleConstant.robotoW400(
                                fontSize: 12,
                                color: ColorConstant.text79,
                              ),
                            ),
                            const SizedBox(
                              height: 16,
                            ),
                            Text(
                              AppLang.local.crop_cultivated,
                              style: TextStyleConstant.robotoW700(
                                fontSize: 16,
                                color: ColorConstant.text79,
                              ),
                            ),
                            const SizedBox(
                              height: 8,
                            ),
                            Text(
                              item.cropsMaster?.name ?? '',
                              style: TextStyleConstant.robotoW400(
                                fontSize: 12,
                                color: ColorConstant.text79,
                              ),
                            ),
                            const SizedBox(
                              height: 16,
                            ),
                            Text(
                              AppLang.local.crop_variety,
                              style: TextStyleConstant.robotoW700(
                                fontSize: 16,
                                color: ColorConstant.text79,
                              ),
                            ),
                            const SizedBox(
                              height: 8,
                            ),
                            Text(
                              item.cropVariety ?? '',
                              style: TextStyleConstant.robotoW400(
                                fontSize: 12,
                                color: ColorConstant.text79,
                              ),
                            ),
                            const SizedBox(
                              height: 16,
                            ),
                            Text(
                              AppLang.local.est_yield,
                              style: TextStyleConstant.robotoW700(
                                fontSize: 16,
                                color: ColorConstant.text79,
                              ),
                            ),
                            const SizedBox(
                              height: 8,
                            ),
                            Text(
                              '${item.estYield} kg',
                              style: TextStyleConstant.robotoW400(
                                fontSize: 12,
                                color: ColorConstant.text79,
                              ),
                            )
                          ],
                        ),
                      )
                    ],
                  ),
                ),
              );
            },
          );
  }
}
