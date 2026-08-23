import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_farmer_info.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/family_info/family_info_model.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class FamilyTabView extends StatelessWidget {
  const FamilyTabView({super.key, required this.farmerId});
  final int farmerId;

  fetchData() async {
    try {
      if (DFarmerInfo.instance.infoFamily == null) {
        final res =
            await ApiProvider.instance.apiFarmer.getFamilyInfo(farmerId);
        DFarmerInfo.instance.infoFamily = res?.data?.familyInfo;
      }
      return DFarmerInfo.instance.infoFamily;
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
            return _buildInfo(snapshot.data as FamilyInfoModel);
        }
      }),
    );
  }

  _buildInfo(FamilyInfoModel familyInfo) {
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
          _buildItem(
            AppLang.local.education,
            familyInfo.education ?? 'N/A',
          ),
          const SizedBox(height: 16),
          _buildItem(
            AppLang.local.guardian_parent_name,
            familyInfo.parentName ?? 'N/A',
          ),
          const SizedBox(height: 16),
          _buildItem(
            AppLang.local.marriage_status,
            familyInfo.marialStatus ?? 'N/A',
          ),
          const SizedBox(height: 16),
          _buildItem(
            AppLang.local.no_of_family_members,
            familyInfo.noOfFamily ?? 'N/A',
          ),
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
