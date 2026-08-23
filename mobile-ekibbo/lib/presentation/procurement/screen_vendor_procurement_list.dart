import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_procurement.dart';
import 'package:agrobase_ekibbo/models/procurement/vendor_procurement.dart';
import 'package:agrobase_ekibbo/presentation/procurement/widget/vendor_item.dart';

class ScreenVendorProcurementList extends StatefulWidget {
  const ScreenVendorProcurementList({super.key});

  @override
  State<ScreenVendorProcurementList> createState() =>
      _ScreenVendorProcurementListState();
}

class _ScreenVendorProcurementListState
    extends State<ScreenVendorProcurementList> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        title: "Vendor Procurement",
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: ColorConstant.primary,
          onRefresh: () async {
            setState(() {});
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: _buildFuture(),
          ),
        ),
      ),
    );
  }

  _buildFuture() {
    return FutureBuilder(
      future: ApiProcurement.getVendorProcurements(), // async work
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
              final datas = snapshot.data as List<MRVendorProcurement>;
              if (datas.isEmpty) return const NoDataView();
              return ListView(
                children: datas
                    .map(
                      (item) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 5.0),
                        child: VendorProcurementItem(item: item),
                      ),
                    )
                    .toList(),
              );
            }
        }
      },
    );
  }
}
