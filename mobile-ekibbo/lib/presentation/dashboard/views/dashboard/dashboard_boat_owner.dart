import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/persistent_header.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_dashboard.dart';
import 'package:agrobase_ekibbo/models/dashboard/dashboard_model.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/sliver_app_bar.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/summary_item_horizontal.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/summary_item_vertical.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/transaction_item_boatowner.dart';

class DashboardBoatOwner extends StatefulWidget {
  const DashboardBoatOwner({super.key});

  @override
  State<DashboardBoatOwner> createState() => _DashboardBoatOwnerState();
}

class _DashboardBoatOwnerState extends State<DashboardBoatOwner> {
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
                            child: TransactionItemBoatOwner(),
                          ),
                          Padding(
                            padding: EdgeInsets.symmetric(vertical: 5),
                            child: TransactionItemBoatOwner(),
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
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                DateHelper.convertDateToStr(DateTime.now(),
                    format: 'MMMM yyyy'),
                style: TextStyleConstant.robotoW600(fontSize: 16),
              ),
              Row(
                children: [
                  IconButton(
                      onPressed: () {}, icon: const Icon(Icons.chevron_left)),
                  IconButton(
                      onPressed: () {}, icon: const Icon(Icons.chevron_right))
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryView(DashboardModel data) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      margin: const EdgeInsets.only(top: 16),
      child: Row(
        children: [
          Expanded(
            child: SummaryItemVertical(
              title: AppLang.local.number_of_trips,
              value: (data.totalFarmer ?? 0).toString(),
              icon: SvgPicture.asset('ic_boat'.iconSvg),
            ),
          ),
          const SizedBox(
            width: 16,
          ),
          Expanded(
            flex: 2,
            child: Column(
              children: [
                SummaryItemHorizontal(
                  title: AppLang.local.total_transit_quantity,
                  value: '${data.totalPlot ?? 0} ha',
                ),
                const SizedBox(
                  height: 16,
                ),
                SummaryItemHorizontal(
                  title: AppLang.local.payment_received,
                  value: '${data.totalExpectedYield} kg',
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
