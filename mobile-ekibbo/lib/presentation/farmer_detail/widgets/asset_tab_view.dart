import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_farmer_info.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/asset_info/asset_info_model.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class AssetTabView extends StatelessWidget {
  const AssetTabView({super.key, required this.farmerId});
  final int farmerId;

  fetchData() async {
    try {
      if (DFarmerInfo.instance.infoAsset == null) {
        final res =
            await ApiProvider.instance.apiFarmer.getAssetInfo(farmerId);
        DFarmerInfo.instance.infoAsset = res?.data?.assetInfo;
      }
      return DFarmerInfo.instance.infoAsset;
    } catch (e) {
      throw Exception();
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: fetchData(),
      builder: ((context, snapshot) {
        switch (snapshot.connectionState) {
          case ConnectionState.waiting:
            return const Center(
              child: AppCircularIndicator(
                color: ColorConstant.primary,
              ),
            );
          default:
            if (snapshot.hasError) {
              return const Center(child: NoDataView());
            }
            if (snapshot.data == null) {
              return const Center(child: NoDataView());
            }
            return _buildInfo(snapshot.data as AssetInfoModel);
        }
      }),
    );
  }

  _buildInfo(AssetInfoModel assetInfo) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: ColorConstant.grayF7F8FA,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildItem(AppLang.local.housing_ownership,
              assetInfo.housingOwnership ?? 'N/A'),
          const SizedBox(height: 16),
          _buildItem(AppLang.local.house_type, assetInfo.houseType ?? 'N/A'),
          const SizedBox(height: 16),
          _buildItem(AppLang.local.consumer_electronics,
              assetInfo.consumerElectronic ?? 'N/A'),
          const SizedBox(height: 16),
          _buildItem(AppLang.local.vehicle, assetInfo.vehicle ?? 'N/A'),
        ],
      ),
    );
  }

  _buildItem(String title, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyleConstant.robotoW700(
            color: ColorConstant.text79,
            fontSize: 16,
          ),
        ),
        const SizedBox(
          height: 8,
        ),
        Text(
          value,
          style: TextStyleConstant.robotoW400(
            color: ColorConstant.text79,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}
