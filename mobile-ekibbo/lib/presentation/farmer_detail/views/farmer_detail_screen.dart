import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:agrobase_ekibbo/components/common.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/persistent_header.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_farmer.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_farmer_info.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/user_info.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/models/menu_farmer_detail.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/widgets/about_tab_view.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/widgets/animal_tab_view.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/widgets/asset_tab_view.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/widgets/bank_tab_view.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/widgets/certificate_tab_view.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/widgets/equipment_tab_view.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/widgets/family_tab_view.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/widgets/finance_tab_view.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/widgets/insurance_tab_view.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/widgets/menu_tab_view.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/widgets/overview_view.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/widgets/farmer_extras_card.dart';

class FarmerDetailScreen extends StatefulWidget {
  const FarmerDetailScreen({
    super.key,
    required this.farmerId,
  });
  final int farmerId;
  @override
  State<FarmerDetailScreen> createState() => _FarmerDetailScreenState();
}

class _FarmerDetailScreenState extends State<FarmerDetailScreen> {
  FarmerModel? _farmer;
  int _index = 0;
  @override
  void initState() {
    _getFarmerDetail();
    super.initState();
  }

  @override
  void dispose() {
    DFarmerInfo.instance.clearData();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    _getFarmerDetail();
  }

  _getFarmerDetail() async {
    final farmerData = await ApiFarmer.getFarmerDetail(widget.farmerId,
        role: DUserInfo.instance.user!.roleUser);
    if (farmerData == null) {
      // ignore: use_build_context_synchronously
      DialogHelper.showOkDialog(context, 'This farmer is not belongs to you!',
          okAction: () {
        Navigator.of(context).pop();
      });
      return;
    }
    setState(() {
      _farmer = farmerData;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.farmer_detail,
        color: ColorConstant.primary,
        titleColor: Colors.white,
        backColor: Colors.white,
        actions: [
          IconButton(
            onPressed: () => Navigator.of(context).pushNamed(
              RouterName.edit_farmer_profile,
              arguments: _farmer,
            ),
            icon: SvgPicture.asset(
              'ic_edit_user'.iconSvg,
            ),
          )
        ],
      ),
      body: Stack(
        children: [
          Positioned(top: 0, left: 0, right: 0, child: WidgetCommon.buildBGDashboard()),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            child: RefreshIndicator(
              color: ColorConstant.primary,
              onRefresh: _onRefresh,
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                    child: Column(
                      children: [
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white,
                              width: 2,
                            ),
                          ),
                          clipBehavior: Clip.hardEdge,
                          child: GInternetImage(
                            url: _farmer?.farmerPhoto,
                            fit: BoxFit.cover,
                          ),
                        ),
                        const SizedBox(
                          height: 16,
                        ),
                        Text(
                          _farmer?.fullName ?? '',
                          style: TextStyleConstant.quicksandW600(
                            fontSize: 18,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Container(
                      height: 116,
                      margin: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(15),
                        color: Colors.white,
                        boxShadow: [
                          BoxShadow(
                            offset: const Offset(4, 4),
                            blurRadius: 15,
                            color: Colors.black.withOpacity(0.15),
                          )
                        ],
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: () => Navigator.of(context).pushNamed(
                                RouterName.list_plots,
                                arguments: _farmer,
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    '${_farmer?.farmLands?.length ?? 0}',
                                    style: TextStyleConstant.worksansW600(
                                      color: ColorConstant.primary,
                                      fontSize: 22,
                                    ),
                                  ),
                                  const SizedBox(
                                    height: 8,
                                  ),
                                  Text(
                                    AppLang.local.plots,
                                    style: TextStyleConstant.robotoW500(
                                      color: ColorConstant.text79,
                                      fontSize: 12,
                                    ),
                                  ),
                                  const SizedBox(
                                    height: 4,
                                  ),
                                  Text(
                                    AppLang.local.view_plots,
                                    style: TextStyleConstant.robotoW400(
                                      color: ColorConstant.primary,
                                      fontSize: 12,
                                    ),
                                  )
                                ],
                              ),
                            ),
                          ),
                          Container(
                            width: 1,
                            color: ColorConstant.greyEBEBEB,
                          ),
                          Expanded(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  (_farmer?.totalArea ?? 0).toStringAsFixed(2),
                                  style: TextStyleConstant.worksansW600(
                                    color: ColorConstant.primary,
                                    fontSize: 22,
                                  ),
                                ),
                                const SizedBox(
                                  height: 8,
                                ),
                                Text(
                                  AppLang.local.total_hectares,
                                  style: TextStyleConstant.robotoW500(
                                    color: ColorConstant.text79,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: FarmerExtrasCard(farmerId: widget.farmerId),
                  ),
                  SliverPersistentHeader(
                    pinned: true,
                    floating: true,
                    delegate: PersistentHeader(
                      widget: MenuTabView(
                        onChanged: (v) {
                          setState(() {
                            _index = v;
                          });
                        },
                        datas: FarmerDetailMenu.values
                            .map((e) => e.getTitle())
                            .toList(),
                      ),
                    ),
                  ),
                  SliverList(
                    delegate: SliverChildListDelegate(
                      [
                        _childrenView(),
                      ],
                    ),
                  )
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _childrenView() {
    switch (_index) {
      case 0:
        return OverviewFarmerDetailView(farmer: _farmer);
      case 1:
        return AboutTabView(farmer: _farmer);
      case 2:
        return FamilyTabView(farmerId: widget.farmerId);
      case 3:
        return AssetTabView(farmerId: widget.farmerId);
      case 4:
        return BankTabView(farmerId: widget.farmerId);
      case 5:
        return FinanceTabView(farmerId: widget.farmerId);
      case 6:
        return InsuranceTabView(farmerId: widget.farmerId);
      case 7:
        return EquipmentTabView(farmerId: widget.farmerId);
      case 8:
        return AnimalTabView(farmerId: widget.farmerId);
      case 9:
        return CertificateTabView(farmerId: widget.farmerId);
    }
    return Container();
  }
}
