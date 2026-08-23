import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/distribution/model_distribution.dart';
import 'package:agrobase_ekibbo/presentation/distribution/screen_detail_distribution.dart';

// ignore: must_be_immutable
class DistributionInfo extends StatelessWidget {
  DistributionInfo(
      {super.key, this.isDetail = true, required this.distribution});
  bool isDetail;
  final MDistribution distribution;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        if (isDetail) return;
        Navigator.of(context).push(MaterialPageRoute(
            builder: (context) =>
                ScreenDetailDistribution(distribution: distribution)));
      },
      child: Container(
        decoration: BoxDecoration(
          color: ColorConstant.grayF7F8FA,
          borderRadius: BorderRadius.circular(15),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildItemInfo(
                      AppLang.local.date,
                      distribution.createdAt.split("T")[0],
                    ),
                    Padding(
                      padding: const EdgeInsets.only(top: 15),
                      child: _buildItemInfo(
                        AppLang.local.farmer,
                        distribution.farmerName,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(top: 15),
                      child: _buildItemInfo(
                        AppLang.local.cooperative,
                        distribution.cooperativeName,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(top: 0),
                      child: _buildItemInfo(
                        AppLang.local.distribution_id,
                        distribution.receiptNo,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(top: 15),
                      child: _buildItemInfo(
                        AppLang.local.province,
                        distribution.provinceName,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(top: 15),
                      child: _buildItemInfo(
                        AppLang.local.total_cost,
                        "${distribution.totalAmount}đ",
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  _buildItemInfo(String key, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          key,
          style: TextStyleConstant.robotoW700(
            fontSize: 16,
            color: ColorConstant.text79,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyleConstant.robotoW400(
            fontSize: 12,
            color: ColorConstant.text79,
          ),
        )
      ],
    );
  }
}
