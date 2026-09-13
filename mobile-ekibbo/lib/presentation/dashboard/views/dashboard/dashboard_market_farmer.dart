import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_dashboard.dart';
import 'package:agrobase_ekibbo/models/dashboard/dashboard_model.dart';
import 'package:agrobase_ekibbo/models/srp/srp_schedule_response.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/farmer_item.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/headerlist_farmer.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/sliver_app_bar.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/summary_item_horizontal.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/summary_item_vertical.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/task_item_view.dart';

class DashboardMarketFarmer extends StatefulWidget {
  const DashboardMarketFarmer({super.key});

  @override
  State<DashboardMarketFarmer> createState() => _DashboardMarketFarmerState();
}

class _DashboardMarketFarmerState extends State<DashboardMarketFarmer> {
  /// 1250 → "1,250" (readable tenant-wide count on the KPI subtitle).
  String _fmtCount(int n) => n.toString().replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');

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
      future: ApiDashboard.getDashboardData(), // async work
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
              return CustomScrollView(
                slivers: [
                  const DashboardAppBar(),
                ],
              );
            } else {
              if (snapshot.data == null) return const NoDataView();
              final data = snapshot.data as DashboardModel;
              return CustomScrollView(
                slivers: [
                  const DashboardAppBar(),
                  SliverToBoxAdapter(
                    child: _buildSummaryView(data),
                  ),
                  // SliverToBoxAdapter(
                  //   child: _buildMenuView(context),
                  // ),
                  // SliverToBoxAdapter(
                  //   child: _buildTaskViewFuture(),
                  // ),
                  const SliverToBoxAdapter(
                    child: SizedBox(height: 20),
                  ),
                  HeaderListFarmer(
                    isOfficerScoped: data.myFarmers == true,
                    officerCount: data.totalFarmer,
                    totalCount: data.totalFarmersTenant,
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: FarmerList(farmerList: data.farmerList ?? []),
                    ),
                  ),
                ],
              );
            }
        }
      },
    );
  }

  _buildTaskViewFuture() {
    return FutureBuilder(
        future: ApiDashboard.getTodayTask(), // async work
        builder: (BuildContext context, snapshot) {
          switch (snapshot.connectionState) {
            case ConnectionState.waiting:
              return const AppCircularIndicator(
                color: ColorConstant.primary,
              );
            default:
              if (snapshot.hasError) {
                return Text('Error: ${snapshot.error}');
              } else {
                final datas = snapshot.data as List<SRPActionModel>;
                return _buildTasksView(context, datas);
              }
          }
        });
  }

  Widget _buildTasksView(BuildContext context, List<SRPActionModel> datas) {
    return Padding(
      padding: const EdgeInsets.only(top: 20),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  AppLang.local.today_tasks,
                  style: TextStyleConstant.robotoW600(fontSize: 16),
                ),
                if (datas.isNotEmpty)
                  InkWell(
                    onTap: () => Navigator.of(context).pushNamed(
                      RouterName.list_transaction,
                      arguments: DateTime.now(),
                    ),
                    child: Text(
                      AppLang.local.view_all_tasks,
                      style: TextStyleConstant.robotoW400(
                        fontSize: 12,
                        color: ColorConstant.primary,
                      ),
                    ),
                  )
              ],
            ),
          ),
          datas.isEmpty
              ? const Padding(
                  padding: EdgeInsets.only(top: 16),
                  child: NoDataView(),
                )
              : Container(
                  margin: const EdgeInsets.only(
                    top: 16,
                  ),
                  height: 182,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.only(left: 16),
                    children: datas.map((e) => TaskItemView(item: e)).toList(),
                  ),
                ),
        ],
      ),
    );
  }

  Container _buildMenuView(BuildContext context) {
    return Container(
      height: 80,
      margin: const EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
      ),
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
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: InkWell(
              onTap: () =>
                  Navigator.of(context).pushNamed(RouterName.near_by_plot),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SvgPicture.asset(
                    'ic_land_plot'.iconSvg,
                  ),
                  const SizedBox(
                    height: 4,
                  ),
                  Text(
                    AppLang.local.nearby_plots,
                    style: TextStyleConstant.quicksandW600(
                        fontSize: 12, color: ColorConstant.text79),
                  )
                ],
              ),
            ),
          ),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SvgPicture.asset(
                  'ic_menu'.iconSvg,
                ),
                const SizedBox(
                  height: 4,
                ),
                Text(
                  AppLang.local.all_tasks,
                  style: TextStyleConstant.quicksandW600(
                      fontSize: 12, color: ColorConstant.text79),
                )
              ],
            ),
          ),
          Expanded(
            child: InkWell(
              onTap: () => Navigator.of(context)
                  .pushNamed(RouterName.transaction_calendar),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SvgPicture.asset(
                    'ic_srp'.iconSvg,
                  ),
                  const SizedBox(
                    height: 4,
                  ),
                  Text(
                    'SRP Module',
                    style: TextStyleConstant.quicksandW600(
                        fontSize: 12, color: ColorConstant.text79),
                  )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }


  /// Second review (H): Total Plants breakdown dialog — per crop type
  /// (Coffee/Robusta, Cocoa, Vanilla, Shade Trees, Bananas, …).
  void _showPlantsBreakdown(DashboardModel data) {
    final rows = data.plantsBreakdown ?? [];
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Total Plants — Breakdown'),
        content: SizedBox(
          width: double.maxFinite,
          child: rows.isEmpty
              ? const Text('No plant records yet.')
              : ListView.builder(
                  shrinkWrap: true,
                  itemCount: rows.length,
                  itemBuilder: (_, i) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(child: Text(rows[i].crop ?? '')),
                        Text('${(rows[i].count ?? 0).toInt()}'),
                      ],
                    ),
                  ),
                ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
  Widget _buildSummaryView(DashboardModel data) {
    // Ekibbo spec: a Field Officer sees ONLY their allocated farmers — the
    // KPI card sits in the total-farmers position but shows the officer's
    // assigned count ("My Farmers"). Roles without farmer assignments
    // (admins / ops managers) see the tenant-wide "Total Farmers".
    // Backend contract: my_farmers == true → total_farmmer is officer-scoped.
    //
    // Consistency fix (UAT): the officer-scoped card also carries the
    // tenant-wide registry total as a subtitle ("of 1,979 in registry") so
    // the dashboard number, the "View All (n)" link and the All Farmers
    // list screen all agree and the 3 vs 1,979 difference is explicit.
    final isOfficerScoped = data.myFarmers == true;
    final cardTitle =
        isOfficerScoped ? 'My Farmers' : AppLang.local.total_farmers;
    final cardValue = isOfficerScoped
        ? (data.totalFarmer ?? data.farmerList?.length ?? 0)
        : (data.totalFarmersTenant ?? data.totalFarmer ?? data.farmerList?.length ?? 0);
    final tenantTotal = data.totalFarmersTenant ?? 0;
    final subtitle = isOfficerScoped && tenantTotal > 0
        ? 'of ${_fmtCount(tenantTotal)} in registry'
        : null;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      margin: const EdgeInsets.only(top: 16),
      child: Row(
        children: [
          Expanded(
            child: SummaryItemVertical(
              title: cardTitle,
              value: cardValue.toString(),
              subtitle: subtitle,
              icon: SvgPicture.asset(
                'ic_farmer'.iconSvg,
                color: ColorConstant.primary,
              ),
            ),
          ),
          const SizedBox(
            width: 16,
          ),
          Expanded(
            flex: 2,
            child: Column(
              children: [
                // Second review (H): Farm Land Registry KPIs —
                // total land plots / total acreage / total plants
                Row(
                  children: [
                    Expanded(
                      child: SummaryItemHorizontal(
                        title: 'Total Land Plots',
                        value: '${(data.totalPlot ?? 0).toInt()}',
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: SummaryItemHorizontal(
                        title: AppLang.local.total_hectares,
                        value: '${(data.totalHectares ?? 0).toStringAsFixed(1)} ha',
                      ),
                    ),
                  ],
                ),
                const SizedBox(
                  height: 16,
                ),
                GestureDetector(
                  onTap: () => _showPlantsBreakdown(data),
                  child: SummaryItemHorizontal(
                    title: 'Total Plants (view details)',
                    value: '${(data.totalPlants ?? 0).toInt()}',
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
