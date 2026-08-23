import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';

class OverviewFarmerDetailView extends StatelessWidget {
  const OverviewFarmerDetailView({
    super.key,
    this.farmer,
  });
  final FarmerModel? farmer;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: _buildInfoBasicView(),
    );
  }

  Container _buildInfoBasicView() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: ColorConstant.grayF7F8FA,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppLang.local.farmer_code,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            farmer?.farmerCode ?? '',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.phone_number,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            farmer?.phoneNumber ?? '',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.location,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            farmer?.location() ?? '',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          )
        ],
      ),
    );
  }
}
