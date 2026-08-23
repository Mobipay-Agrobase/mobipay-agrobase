import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/sale_intention/sale_intention_response.dart';
import 'package:agrobase_ekibbo/presentation/sale_intention/widget/pre_harvest_data.dart';

class ScreenSaleIntentionDetail extends StatelessWidget {
  const ScreenSaleIntentionDetail({super.key, required this.saleIntention});
  final SaleIntentionModel saleIntention;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.add_sale_intention,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Container(
            padding: const EdgeInsets.all(22),
            margin: const EdgeInsets.only(bottom: 16),
            width: double.maxFinite,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(15),
              color: ColorConstant.grayF7F8FA,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildInfoItem(
                            AppLang.local.transaction_date,
                            DateHelper.convertDateToStr(
                                saleIntention.createdAt!,
                                format: 'dd/MM/yyyy'),
                          ),
                          _buildInfoItem(
                            AppLang.local.product,
                            saleIntention.variety ?? '',
                          ),
                          _buildInfoItem(
                            AppLang.local.farmer,
                            saleIntention.farmer?.fullName ?? '',
                          ),
                          _buildInfoItem(
                            AppLang.local.grade,
                            saleIntention.grade ?? '',
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildInfoItem(
                            AppLang.local.age_of_crop,
                            saleIntention.ageOfCrop ?? '',
                          ),
                          _buildInfoItem(
                            AppLang.local.price_from,
                            "${saleIntention.minPrice} đ",
                          ),
                          // _buildInfoItem(
                          //   AppLang.local.price_to,
                          //   "${saleIntention.maxPrice} đ",
                          // ),
                          _buildInfoItem(
                            AppLang.local.quantity,
                            "${saleIntention.quantity} KG",
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                GInternetImage(
                  url: saleIntention.photo,
                  height: 94,
                  borderRadius: 8,
                  width: 160,
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 10.0),
                  child: Text(
                    AppLang.local.pre_harvest_quality_check,
                    style: TextStyleConstant.robotoW700(
                      fontSize: 16,
                      color: ColorConstant.text79,
                    ),
                  ),
                ),
                PreHarvestDataShow(
                    preHarvestQC: saleIntention.preHarvestQC ?? []),
              ],
            ),
          ),
        ),
      ),
    );
  }

  _buildInfoItem(String title, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            value,
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
        ],
      ),
    );
  }
}
