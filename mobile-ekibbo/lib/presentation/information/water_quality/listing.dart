import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_listings.dart';
import 'package:agrobase_ekibbo/models/information/water_quality_response.dart';
import 'package:agrobase_ekibbo/presentation/information/water_quality/widgets/water_quality_item.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

class ScreenWaterQualityListing extends StatefulWidget {
  const ScreenWaterQualityListing({super.key});

  @override
  State<ScreenWaterQualityListing> createState() =>
      _ScreenCheckFishingListingState();
}

class _ScreenCheckFishingListingState extends State<ScreenWaterQualityListing> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        title: 'Water Quality Information',
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: ColorConstant.primary,
          onRefresh: () async {
            //DListingData.instance.checkFishings = null;
            //setState(() {});
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
      future: DListingData.instance.fetchWaterQuality(), // async work
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
              final datas = snapshot.data as List<WaterQualityInfoResponse>;
              if (datas.isEmpty) return const NoDataView();
              return ListView(
                children: datas
                    .map((item) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 5.0),
                          child: WaterQualityItem(
                            item: item,
                            onUpdate: () {
                              Navigator.of(context).pushNamed(
                                  RouterName.add_water_quanlity_info,
                                  arguments: {'params': item}).then((value) {
                                if (value == null) return;
                                setState(() {});
                              });
                            },
                          ),
                        ))
                    .toList(),
              );
            }
        }
      },
    );
  }
}
