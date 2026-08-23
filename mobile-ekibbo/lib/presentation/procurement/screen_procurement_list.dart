import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_listings.dart';
import 'package:agrobase_ekibbo/models/procurement/procurement_model.dart';
import 'package:agrobase_ekibbo/presentation/procurement/widget/procurement_item.dart';

class ScreenProcurementList extends StatefulWidget {
  const ScreenProcurementList({super.key});

  @override
  State<ScreenProcurementList> createState() => _ScreenProcurementListState();
}

class _ScreenProcurementListState extends State<ScreenProcurementList> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.procurement,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: ColorConstant.primary,
          onRefresh: () async {
            DListingData.instance.procurements = null;
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
      future: DListingData.instance.fetchProcurement(), // async work
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
              return ListView(
                children: const [
                  NoDataView(),
                ],
              );
            } else {
              if (snapshot.data == null) {
                return ListView(
                  children: const [
                    NoDataView(),
                  ],
                );
              }
              final datas = snapshot.data as List<MProcurement>;
              if (datas.isEmpty) {
                return ListView(
                  children: const [
                    NoDataView(),
                  ],
                );
              }
              return ListView(
                children: datas
                    .map(
                      (item) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 5.0),
                        child: ProcurementItem(mProcurement: item),
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
