import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';

class AboutTabView extends StatelessWidget {
  const AboutTabView({
    super.key,
    this.farmer,
  });
  final FarmerModel? farmer;
  @override
  Widget build(BuildContext context) {
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
          Text(
            AppLang.local.full_name,
            style: TextStyleConstant.robotoW700(
              color: ColorConstant.text79,
              fontSize: 16,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            farmer?.fullName ?? 'N/A',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
              fontSize: 12,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.gender,
            style: TextStyleConstant.robotoW700(
              color: ColorConstant.text79,
              fontSize: 16,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            farmer?.gender ?? 'N/A',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
              fontSize: 12,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.date_of_birth,
            style: TextStyleConstant.robotoW700(
              color: ColorConstant.text79,
              fontSize: 16,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            farmer?.dob ?? 'N/A',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
