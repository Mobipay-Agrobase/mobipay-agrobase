import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/procurement/procurement_model.dart';

// ignore: must_be_immutable
class ScreenProcurementDetail extends StatelessWidget {
  ScreenProcurementDetail({super.key, required this.mProcurement});
  final MProcurement mProcurement;

  final List<String> tabs = ["General", "Product", "Other Costs"];
  late List<Widget> tabViews = <Widget>[
    _wBuildGenaral(),
    _wBuildProductList(),
    _wBuildOtherCosts(),
  ];

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: tabs.length,
      child: SafeArea(
        child: Scaffold(
          backgroundColor: Colors.white,
          appBar: CustomAppBar(
            title: AppLang.local.procurement,
            size: 100,
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(40),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Padding(
                  padding: const EdgeInsets.only(left: 10.0),
                  child: TabBar(
                    indicatorSize: TabBarIndicatorSize.label,
                    indicatorColor: ColorConstant.primary,
                    isScrollable: true,
                    tabs: tabs
                        .map(
                          (e) => Tab(
                            child: Text(
                              e,
                              style: TextStyleConstant.robotoW400(
                                fontSize: 14,
                                color: ColorConstant.text79,
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
              ),
            ),
          ),
          body: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 26.0, vertical: 10),
            child: TabBarView(children: tabViews.map((e) => e).toList()),
          ),
        ),
      ),
    );
  }

  Widget _wBuildGenaral() {
    return Container(
      decoration: BoxDecoration(
        color: ColorConstant.grayF7F8FA,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: ListView(
          children: [
            _buildItemInfo(
              AppLang.local.date,
              mProcurement.transactionDate.split(" ")[0],
            ),
            Padding(
              padding: const EdgeInsets.only(top: 15),
              child: _buildItemInfo(
                AppLang.local.total_cost,
                mProcurement.totalAmount.toString(),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 15),
              child: _buildItemInfo(
                '${AppLang.local.procurement} Code',
                mProcurement.procurementCode,
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 15),
              child: _buildItemInfo(
                "Driver",
                mProcurement.booking.vehicle.driverName,
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 15),
              child: _buildItemInfo(
                "Ware house code",
                mProcurement.warehouse.code,
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 15),
              child: _buildItemInfo(
                "Ware house name",
                mProcurement.warehouse.name,
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 15),
              child: _buildItemInfo(
                "Ware house capacity",
                "${mProcurement.warehouse.capacity} MT",
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 15),
              child: _buildItemInfo(
                "Booking code",
                mProcurement.booking.bookingCode,
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 15),
              child: _buildItemInfo(
                "Booking date",
                mProcurement.booking.bookingDate,
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 15),
              child: _buildItemInfo(
                "Driver name",
                mProcurement.booking.vehicle.driverName,
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 15),
              child: _buildItemInfo(
                "Driver phone number",
                mProcurement.booking.vehicle.driverPhoneNumber,
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 15),
              child: _buildItemInfo(
                "License number",
                mProcurement.booking.vehicle.licenseNumber,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _wBuildProductList() {
    return mProcurement.details.isEmpty
        ? const NoDataView()
        : ListView(
            children: mProcurement.details
                .map((e) => Padding(
                      padding: const EdgeInsets.only(bottom: 10.0),
                      child: _buildInfoProduct(e),
                    ))
                .toList());
  }

  Widget _wBuildOtherCosts() {
    return mProcurement.otherCosts.isEmpty
        ? const NoDataView()
        : ListView(
            children: mProcurement.otherCosts
                .map((e) => Padding(
                      padding: const EdgeInsets.only(bottom: 10.0),
                      child: _buildInfoOrtherCost(e),
                    ))
                .toList());
  }

  Widget _buildInfoProduct(MDetails details) {
    return Container(
      decoration: BoxDecoration(
        color: ColorConstant.grayF7F8FA,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildItemInfo(
                      AppLang.local.date, details.createdAt.split("T")[0]),
                  const SizedBox(height: 15),
                  _buildItemInfo(
                      AppLang.local.actual_qty, "${details.actualQty} MT"),
                ],
              ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildItemInfo(AppLang.local.crop_harvest,
                      details.cropHarvestDetailId.toString()),
                  const SizedBox(height: 15),
                  _buildItemInfo(
                      "Actual Sub Total", "${details.actualSubTotal}đ"),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoOrtherCost(MOtherCost mOtherCost) {
    return Container(
      decoration: BoxDecoration(
        color: ColorConstant.grayF7F8FA,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildItemInfo(AppLang.local.item, mOtherCost.item),
                  const SizedBox(height: 15),
                  _buildItemInfo(
                      AppLang.local.quantity, "${mOtherCost.quantity} MT"),
                ],
              ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildItemInfo(AppLang.local.rate, "${mOtherCost.rate}đ"),
                  const SizedBox(height: 15),
                  _buildItemInfo(
                      AppLang.local.sub_total, "${mOtherCost.subTotal}đ"),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  _buildItemInfo(String key, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          key,
          style: TextStyleConstant.robotoW700(
            fontSize: 16,
            color: ColorConstant.text79,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyleConstant.robotoW400(
            fontSize: 12,
            color: ColorConstant.text79,
          ),
        )
      ],
    );
  }
}
