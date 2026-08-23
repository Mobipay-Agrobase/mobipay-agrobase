// ignore_for_file: use_build_context_synchronously

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/persistent_header.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/domain/roles/role_config.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/user_info.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
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

  @override
  void initState() {
    _getFarmlandDetail();
    _getSpecies();
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
                        _tabIndex == 0 ? _buildFarmInfo() : _buildSpeciesList(),
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
          Text(
            AppLang.local.approach_road,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            _farmland!.approachRoad ?? '',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.land_topology,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            _farmland!.landTopology ?? '',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.land_gradient,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            _farmland!.landGradient ?? '',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.land_document,
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
                RouterName.land_document,
                arguments: _farmland?.landDocument),
            child: Text(
              'View land document',
              style: TextStyleConstant.robotoW400(color: ColorConstant.primary)
                  .copyWith(
                decoration: TextDecoration.underline,
              ),
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
                                (DUserInfo.instance.user!.roleUser ==
                                        EnumUserRole.staff)
                                    ? IconButton(
                                        icon: const Icon(
                                          Icons.edit,
                                          color: ColorConstant.text79,
                                        ),
                                        onPressed: () async {
                                          Navigator.of(context).pushNamed(
                                              RouterName.add_crop,
                                              arguments: {
                                                'crop': item,
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
