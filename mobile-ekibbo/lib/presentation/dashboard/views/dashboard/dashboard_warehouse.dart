import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/persistent_header.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_dashboard.dart';
import 'package:agrobase_ekibbo/models/dashboard/dashboard_model.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/sliver_app_bar.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/summary_item_horizontal.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/transaction_item_warehouse.dart';

class DashboardWarehouse extends StatefulWidget {
  const DashboardWarehouse({super.key});

  @override
  State<DashboardWarehouse> createState() => _DashboardWarehouseState();
}

class _DashboardWarehouseState extends State<DashboardWarehouse> {
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
              return const NoDataView();
            } else {
              if (snapshot.data == null) return const NoDataView();
              final data = snapshot.data as DashboardModel;
              return CustomScrollView(
                slivers: [
                  const DashboardAppBar(),
                  SliverToBoxAdapter(
                    child: _buildSummaryView(data),
                  ),
                  const SliverToBoxAdapter(
                    child: SizedBox(
                      height: 20,
                    ),
                  ),
                  _buildHeaderTime(),
                  const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        children: [
                          Padding(
                            padding: EdgeInsets.symmetric(vertical: 5),
                            child: TransactionItemWarehouse(),
                          ),
                          Padding(
                            padding: EdgeInsets.symmetric(vertical: 5),
                            child: TransactionItemWarehouse(),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            }
        }
      },
    );
  }

  _buildHeaderTime() {
    return SliverPersistentHeader(
      pinned: true,
      floating: true,
      delegate: PersistentHeader(
        height: 52,
        widget: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'Transaction',
              style: TextStyleConstant.robotoW600(fontSize: 16),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryView(DashboardModel data) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      margin: const EdgeInsets.only(top: 16),
      child: Column(
        children: [
          SummaryItemHorizontal(
              title: AppLang.local.total_received_quantity,
              value: '${data.totalPlot ?? 0} Kg'),
          const SizedBox(height: 16),
          SummaryItemHorizontal(
              title: AppLang.local.total_transit_quantity,
              value: '${data.totalExpectedYield} MT'),
          const SizedBox(height: 16),
          SummaryItemHorizontal(
              title: AppLang.local.payment_received, value: '123,456,678đ'),
        ],
      ),
    );
  }
}
