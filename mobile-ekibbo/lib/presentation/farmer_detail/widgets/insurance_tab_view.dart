import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_farmer_info.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/insurance/insurance_info_response.dart';

class InsuranceTabView extends StatelessWidget {
  const InsuranceTabView({super.key, required this.farmerId});
  final int farmerId;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: DFarmerInfo.instance.fetchDataInfoInsurances(farmerId),
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
            final insurances = snapshot.data as List<InsuranceInfoModel>;
            return insurances.isEmpty
                ? const NoDataView()
                : ListView.builder(
                    itemCount: insurances.length,
                    padding: const EdgeInsets.all(16),
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemBuilder: (_, index) {
                      return _buildItemView(insurances[index]);
                    },
                  );
        }
      }),
    );
  }

  Container _buildItemView(InsuranceInfoModel insurance) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.only(
        bottom: 16,
        left: 16,
        right: 16,
      ),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: ColorConstant.grayF7F8FA,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (insurance.lifeInsurance?.toLowerCase() == 'yes')
            _buildInfo(
              AppLang.local.life_insurance,
              insurance.providerLifeInsurance ?? 'N/A',
              insurance.lifeInsuranceEnrolledDate ?? 'N/A',
              insurance.lifeInsuranceEndDate ?? 'N/A',
            ),
          if (insurance.healthInsurance?.toLowerCase() == 'yes')
            _buildInfo(
              AppLang.local.health_insurance,
              insurance.providerHealthInsurance ?? 'N/A',
              insurance.healthInsuranceEnrolledDate ?? 'N/A',
              insurance.healthInsuranceEndDate ?? 'N/A',
            ),
          if (insurance.cropInsurance?.toLowerCase() == 'yes')
            _buildInfo(
              AppLang.local.crop_insurance,
              insurance.providerCropInsurance ?? 'N/A',
              insurance.cropInsuranceEnrolledDate ?? 'N/A',
              insurance.cropInsuranceEndDate ?? 'N/A',
            ),
          if (insurance.socialInsurance?.toLowerCase() == 'yes')
            _buildInfo(
              AppLang.local.social_insurance,
              insurance.providerSocialInsurance ?? 'N/A',
              insurance.socialInsuranceEnrolledDate ?? 'N/A',
              insurance.socialInsuranceEndDate ?? 'N/A',
            ),
        ],
      ),
    );
  }

  Widget _buildInfo(
    String title,
    String provider,
    String enrollmentDate,
    String endDate,
  ) {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
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
            provider,
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
              fontSize: 12,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.enrollment_date,
            style: TextStyleConstant.robotoW700(
              color: ColorConstant.text79,
              fontSize: 16,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            enrollmentDate,
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
              fontSize: 12,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.end_date,
            style: TextStyleConstant.robotoW700(
              color: ColorConstant.text79,
              fontSize: 16,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            endDate,
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
