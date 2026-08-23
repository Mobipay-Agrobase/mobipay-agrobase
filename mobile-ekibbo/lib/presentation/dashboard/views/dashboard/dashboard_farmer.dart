import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/persistent_header.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/core/extension/extention.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_dashboard.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_farmer_info.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/user_info.dart';
import 'package:agrobase_ekibbo/models/dashboard/dashboard_model_famer.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/calendar_farmer.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/sliver_app_bar.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/summary_item_horizontal.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/summary_item_vertical.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/weather_info.dart';
import 'package:agrobase_ekibbo/presentation/plot/widget/farmland_item.dart';

class DashboardFarmer extends StatefulWidget {
  const DashboardFarmer({super.key});

  @override
  State<DashboardFarmer> createState() => _DashboardFarmerState();
}

class _DashboardFarmerState extends State<DashboardFarmer> {
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: RefreshIndicator(
        color: ColorConstant.primary,
        onRefresh: () async {
          setState(() {});
        },
        child: _buildDashboardFuture(),
      ),
    );
  }

  _buildDashboardFuture() {
    return FutureBuilder(
      future: ApiDashboard.getDashboardFarmer(), // async work
      builder: (BuildContext context, snapshot) {
        switch (snapshot.connectionState) {
          case ConnectionState.waiting:
            return const Center(
              child: AppCircularIndicator(
                color: ColorConstant.primary,
              ),
            );
          default:
            if (snapshot.hasError) {
              return const NoDataView();
            } else {
              if (snapshot.data == null) return const NoDataView();
              final data = snapshot.data as MDashboardFarmer;
              return CustomScrollView(
                slivers: [
                  const DashboardAppBar(),
                  SliverToBoxAdapter(
                    child: _buildSummaryView(data),
                  ),
                  SliverToBoxAdapter(
                    child: _buildLoanAndRepay(data),
                  ),
                  const SliverToBoxAdapter(
                    child: CalendarFarmer(),
                  ),
                  const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: WeatherInfo(),
                    ),
                  ),
                  _buildHeaderFarmLand(),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: buildFutureFarmland(),
                    ),
                  ),
                ],
              );
            }
        }
      },
    );
  }

  _buildLoanAndRepay(MDashboardFarmer data) {
    return Padding(
      padding: const EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Loan Amount",
                  style: TextStyleConstant.robotoW500(
                    fontSize: 14,
                    color: ColorConstant.text79,
                  ),
                ),
                Text(
                  "${data.loanAmmount.formatPrice()} đ",
                  style: TextStyleConstant.robotoW600(
                    fontSize: 16,
                    color: ColorConstant.redFF1A21,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Container(
              color: Colors.grey,
              width: 1,
              height: 30,
            ),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Repay Amount",
                  style: TextStyleConstant.robotoW500(
                    fontSize: 14,
                    color: ColorConstant.text79,
                  ),
                ),
                Text(
                  "${data.repayAmmount.formatPrice()} đ",
                  style: TextStyleConstant.robotoW600(
                    fontSize: 16,
                    color: ColorConstant.primary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  _buildHeaderFarmLand() {
    return SliverPersistentHeader(
      pinned: true,
      floating: true,
      delegate: PersistentHeader(
        height: 52,
        widget: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              AppLang.local.plots,
              style: TextStyleConstant.robotoW600(fontSize: 16),
            ),
          ),
        ),
      ),
    );
  }

  buildFutureFarmland() {
    return FutureBuilder(
      future: DFarmerInfo.instance
          .fetchDataFarmland(DUserInfo.instance.user!.farmerId), // async work
      builder: (BuildContext context, snapshot) {
        switch (snapshot.connectionState) {
          case ConnectionState.waiting:
            return const Center(
              child: AppCircularIndicator(
                color: ColorConstant.primary,
              ),
            );
          default:
            if (snapshot.hasError) {
              return const NoDataView();
            } else {
              final datas = snapshot.data as List<FarmLandModel>;
              if (datas.isEmpty) return const NoDataView();
              return Column(
                children:
                    datas.map((item) => FarmlandItem(item: item)).toList(),
              );
            }
        }
      },
    );
  }

  Widget _buildSummaryView(MDashboardFarmer data) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      margin: const EdgeInsets.only(top: 16),
      child: Row(
        children: [
          Expanded(
            child: SummaryItemVertical(
              title: 'Number Of Plots',
              value: data.totalPlots.toString(),
              icon: SvgPicture.asset('ic_land_plot'.iconSvg),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: Column(
              children: [
                SummaryItemHorizontal(
                  title: AppLang.local.total_hectares,
                  value: '${(data.totalHectares).toStringAsFixed(1)} ha',
                ),
                const SizedBox(
                  height: 16,
                ),
                SummaryItemHorizontal(
                  title: AppLang.local.est_yield_quantity,
                  value: '${(data.estYieldQuantity.formatPrice())} kg',
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
