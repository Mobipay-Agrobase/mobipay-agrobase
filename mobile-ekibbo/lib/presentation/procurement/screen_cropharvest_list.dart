import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_listings.dart';
import 'package:agrobase_ekibbo/models/crop/crop_harvest_model.dart';
import 'package:agrobase_ekibbo/presentation/procurement/widget/crop_harvest_item.dart';

class ScreenCropHarvestList extends StatefulWidget {
  const ScreenCropHarvestList({super.key});

  @override
  State<ScreenCropHarvestList> createState() => _ScreenCropHarvestListState();
}

class _ScreenCropHarvestListState extends State<ScreenCropHarvestList> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.crop_harvest,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: ColorConstant.primary,
          onRefresh: () async {
            DListingData.instance.cropHartvests = null;
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
      future: DListingData.instance.fetchCropHarvest(), // async work
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
              final datas = snapshot.data as List<MCropHarvest>;
              if (datas.isEmpty) return const NoDataView();
              return ListView(
                children: datas
                    .map((item) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 5.0),
                          child: CropHarvestItem(mCropHarvest: item),
                        ))
                    .toList(),
              );
            }
        }
      },
    );
  }
}
