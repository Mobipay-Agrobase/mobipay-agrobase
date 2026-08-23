import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_farmer_info.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

class FarmlandItem extends StatelessWidget {
  final FarmLandModel item;
  const FarmlandItem({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.of(context).pushNamed(
        RouterName.plot_detail,
        arguments: {
          'farmer': DFarmerInfo.instance.farmer,
          'plot': item,
        },
      ),
      child: Container(
        height: 203,
        padding: const EdgeInsets.only(
          top: 24,
          left: 16,
          right: 16,
          bottom: 16,
        ),
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(15),
          color: ColorConstant.grayF6F7F9,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 48,
              width: 48,
              // color: Colors.red,
              child: Stack(
                children: [
                  const Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: CircularProgressIndicator(
                      value: 0.7,
                      strokeWidth: 5,
                      backgroundColor: ColorConstant.greyEBEBEB,
                      color: ColorConstant.primary,
                    ),
                  ),
                  Center(
                    child: Text(
                      '70%',
                      style: TextStyleConstant.robotoW400(
                        fontSize: 12,
                        color: ColorConstant.text79,
                      ),
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(
              width: 13,
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        AppLang.local.plot_name,
                        style: TextStyleConstant.robotoW700(
                          fontSize: 16,
                          color: ColorConstant.text79,
                        ),
                      ),
                      const Icon(
                        Icons.more_horiz,
                        color: ColorConstant.text79,
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 8,
                  ),
                  Text(
                    item.farmName ?? '',
                    style: TextStyleConstant.robotoW400(
                      fontSize: 12,
                      color: ColorConstant.text79,
                    ),
                  ),
                  const SizedBox(
                    height: 16,
                  ),
                  Text(
                    AppLang.local.total_land_holding,
                    style: TextStyleConstant.robotoW700(
                      fontSize: 16,
                      color: ColorConstant.text79,
                    ),
                  ),
                  const SizedBox(
                    height: 8,
                  ),
                  Text(
                    '${item.totalLandHolding ?? 0} ha',
                    style: TextStyleConstant.robotoW400(
                      fontSize: 12,
                      color: ColorConstant.text79,
                    ),
                  ),
                  const SizedBox(
                    height: 16,
                  ),
                  Text(
                    AppLang.local.total_crops,
                    style: TextStyleConstant.robotoW700(
                      fontSize: 16,
                      color: ColorConstant.text79,
                    ),
                  ),
                  const SizedBox(
                    height: 8,
                  ),
                  Text(
                    '${item.totalCultivation ?? 0}',
                    style: TextStyleConstant.robotoW400(
                      fontSize: 12,
                      color: ColorConstant.text79,
                    ),
                  )
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}
