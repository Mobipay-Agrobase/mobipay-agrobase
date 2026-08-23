import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_farmer_info.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/certificate/certificate_response.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class CertificateTabView extends StatelessWidget {
  const CertificateTabView({super.key, required this.farmerId});
  final int farmerId;

  fetchData() async {
    try {
      if (DFarmerInfo.instance.infoCert == null) {
        final res =
            await ApiProvider.instance.apiFarmer.getCertificateInfo(farmerId);
        DFarmerInfo.instance.infoCert = res?.data?.certificateInfo;
      }
      return DFarmerInfo.instance.infoCert;
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
            return _buildInfo(snapshot.data as CertificateModel);
        }
      }),
    );
  }

  _buildInfo(CertificateModel cert) {
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
            AppLang.local.certified_farmer,
            style: TextStyleConstant.robotoW700(
              color: ColorConstant.text79,
              fontSize: 16,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            cert.isCertifiedFarmer ?? 'N/A',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
              fontSize: 12,
            ),
          ),
          if (cert.isCertifiedFarmer?.toLowerCase() == 'yes')
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(
                  height: 16,
                ),
                Text(
                  AppLang.local.certification_type,
                  style: TextStyleConstant.robotoW700(
                    color: ColorConstant.text79,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(
                  height: 8,
                ),
                Text(
                  cert.certificationType ?? 'N/A',
                  style: TextStyleConstant.robotoW400(
                    color: ColorConstant.text79,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(
                  height: 16,
                ),
                Text(
                  AppLang.local.year,
                  style: TextStyleConstant.robotoW700(
                    color: ColorConstant.text79,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(
                  height: 8,
                ),
                Text(
                  cert.yearOfIcs ?? 'N/A',
                  style: TextStyleConstant.robotoW400(
                    color: ColorConstant.text79,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
