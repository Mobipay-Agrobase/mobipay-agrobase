import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:gap/gap.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/models/srp/srp_schedule_response.dart';

class SRPItemView extends StatelessWidget {
  const SRPItemView({
    super.key,
    required this.item,
    this.onTap,
  });
  final SRPActionModel item;
  final Function()? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(15),
          color: ColorConstant.grayF7F8FA,
        ),
        child: Column(
          children: [
            Row(
              children: [
                GInternetImage(
                  url: item.srp?.farmer?.image,
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                ),
                const Gap(16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.srp?.farmer?.fullName ?? '',
                      style: TextStyleConstant.quicksandW600(
                        fontSize: 18,
                      ),
                    ),
                    const Gap(8),
                    Row(
                      children: [
                        SvgPicture.asset('ic_#'.iconSvg),
                        const Gap(4),
                        Text(
                          item.srp?.farmer?.farmerCode ?? '',
                          style: TextStyleConstant.robotoW400(
                              color: ColorConstant.text79),
                        ),
                      ],
                    ),
                    const Gap(8),
                    Row(
                      children: [
                        SvgPicture.asset('ic_calling'.iconSvg),
                        const Gap(4),
                        Text(
                          item.srp?.farmer?.phoneNumber ?? '',
                          style: TextStyleConstant.robotoW400(
                              color: ColorConstant.text79),
                        ),
                      ],
                    ),
                  ],
                )
              ],
            ),
            Container(
              height: 1,
              margin: const EdgeInsets.symmetric(vertical: 16),
              color: ColorConstant.greyEBEBEB,
            ),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Crop',
                        style: TextStyleConstant.robotoW700(
                          color: ColorConstant.text79,
                        ),
                      ),
                      const Gap(8),
                      Text(
                        item.srp?.cultivation?.cropVariety ?? '',
                        style: TextStyleConstant.robotoW400(
                          fontSize: 12,
                          color: ColorConstant.text79,
                        ),
                      )
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Schedule',
                        style: TextStyleConstant.robotoW700(
                          color: ColorConstant.text79,
                        ),
                      ),
                      const Gap(8),
                      Text(
                        item.getNameAction().toTitleCase(),
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
            const Gap(20),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Harvest Season',
                        style: TextStyleConstant.robotoW700(
                          color: ColorConstant.text79,
                        ),
                      ),
                      const Gap(8),
                      Text(
                        item.srp?.season ?? '',
                        style: TextStyleConstant.robotoW400(
                          fontSize: 12,
                          color: ColorConstant.text79,
                        ),
                      )
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Sowing Date',
                        style: TextStyleConstant.robotoW700(
                          color: ColorConstant.text79,
                        ),
                      ),
                      const Gap(8),
                      Text(
                        item.srp?.sowing_date ?? '',
                        style: TextStyleConstant.robotoW400(
                          fontSize: 12,
                          color: ColorConstant.text79,
                        ),
                      )
                    ],
                  ),
                )
              ],
            )
          ],
        ),
      ),
    );
  }
}
