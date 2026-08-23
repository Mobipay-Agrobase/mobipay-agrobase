import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/user_info.dart';
import 'package:agrobase_ekibbo/domain/roles/role_config.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_farmer.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/domain/roles/role_config.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/user_info.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class ListPlotScreen extends StatefulWidget {
  const ListPlotScreen({
    super.key,
    this.farmer,
  });
  final FarmerModel? farmer;
  @override
  State<ListPlotScreen> createState() => _ListPlotScreenState();
}

class _ListPlotScreenState extends State<ListPlotScreen> {
  List<FarmLandModel> _farmlands = [];
  bool _isLoading = true;
  @override
  void initState() {
    super.initState();
    if (widget.farmer != null) {
      _getAllFarmLand();
    } else if (DUserInfo.instance.user!.roleUser == EnumUserRole.farmer) {
      _loadOwnFarmer();
    } else {
      // Staff opened the registry-wide Farm Land Registry — pick a farmer first.
      _pickFarmer();
    }
    _isLoading = widget.farmer == null;
  }

  Future<void> _loadOwnFarmer() async {
    final own = await ApiFarmer.getFarmerDetailRoleFarmer();
    if (own != null) {
      _selectedFarmer = own;
      _getAllFarmLand();
    } else {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _pickFarmer() async {
    final picked = await Navigator.of(context).pushNamed(
      RouterName.farmer_list,
    );
    setState(() => _isLoading = false);
  }

  FarmerModel? _selectedFarmer;

  FarmerModel get effectiveFarmer => widget.farmer ?? _selectedFarmer!;

  _getAllFarmLand() async {
    if (effectiveFarmer.id == null) {
      setState(() => _isLoading = false);
      return;
    }
    final res = await ApiProvider.instance.apiFarmland
        .getAllFarmLands(effectiveFarmer.id!);

    if (res?.data != null) {
      setState(() {
        _isLoading = false;
        _farmlands = res?.data?.farmLandData ?? [];
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.all_plots,
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
                text: effectiveFarmer.fullName,
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
              ? InkWell(
                  onTap: () => Navigator.of(context).pushNamed(
                    RouterName.add_plot,
                    arguments: {'farmer': effectiveFarmer},
                  ).then((value) {
                    if (value != null) {
                      _getAllFarmLand();
                    }
                  }),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: SvgPicture.asset(
                      'ic_add_fill'.iconSvg,
                      color: ColorConstant.primary,
                    ),
                  ),
                )
              : const SizedBox.shrink()
        ],
      ),
      body: _isLoading
          ? const AppCircularIndicator()
          : _farmlands.isEmpty
              ? const NoDataView()
              : ListView.builder(
                  itemCount: _farmlands.length,
                  padding: const EdgeInsets.all(16),
                  shrinkWrap: true,
                  itemBuilder: (_, index) {
                    final item = _farmlands[index];
                    return InkWell(
                      onTap: () => Navigator.of(context).pushNamed(
                        RouterName.plot_detail,
                        arguments: {
                          'farmer': effectiveFarmer,
                          'plot': item,
                        },
                      ),
                      child: Container(
                        height: 203,
                        padding: const EdgeInsets.only(
                          top: 24,
                          left: 16,
                          right: 16,
                          bottom: 16,
                        ),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(15),
                          color: ColorConstant.grayF6F7F9,
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(
                              height: 48,
                              width: 48,
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
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        AppLang.local.plot_name,
                                        style: TextStyleConstant.robotoW700(
                                          fontSize: 16,
                                          color: ColorConstant.text79,
                                        ),
                                      ),
                                      const Icon(
                                        Icons.more_horiz,
                                        color: ColorConstant.text79,
                                      ),
                                    ],
                                  ),
                                  const SizedBox(
                                    height: 8,
                                  ),
                                  Text(
                                    item.farmName ?? '',
                                    style: TextStyleConstant.robotoW400(
                                      fontSize: 12,
                                      color: ColorConstant.text79,
                                    ),
                                  ),
                                  const SizedBox(
                                    height: 16,
                                  ),
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
                                    '${item.totalLandHolding ?? 0} ha',
                                    style: TextStyleConstant.robotoW400(
                                      fontSize: 12,
                                      color: ColorConstant.text79,
                                    ),
                                  ),
                                  const SizedBox(
                                    height: 16,
                                  ),
                                  Text(
                                    AppLang.local.total_crops,
                                    style: TextStyleConstant.robotoW700(
                                      fontSize: 16,
                                      color: ColorConstant.text79,
                                    ),
                                  ),
                                  const SizedBox(
                                    height: 8,
                                  ),
                                  Text(
                                    '${item.totalCultivation ?? 0}',
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
                ),
    );
  }
}
