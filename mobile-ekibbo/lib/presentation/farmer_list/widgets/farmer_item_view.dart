import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

class FarmerItemView extends StatelessWidget {
  const FarmerItemView({
    super.key,
    required this.farmer,
  });
  final FarmerModel farmer;
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.of(context)
          .pushNamed(RouterName.farmer_detail, arguments: farmer.id),
      child: Container(
        padding: const EdgeInsets.only(
          left: 20,
          right: 16,
          top: 24,
          bottom: 18,
        ),
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: ColorConstant.grayF7F8FA,
          borderRadius: BorderRadius.circular(15),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GInternetImage(
              url: farmer.avatarUrl,
              width: 60,
              height: 60,
              borderRadius: 30,
            ),
            const SizedBox(
              width: 16,
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          farmer.fullName ?? '',
                          style: TextStyleConstant.quicksandW600(
                            fontSize: 18,
                          ),
                        ),
                      ),
                      const Icon(
                        Icons.more_horiz,
                        color: ColorConstant.text79,
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 16,
                  ),
                  _buildRowInfo(
                    'ic_#',
                    farmer.farmerCode ?? '',
                  ),
                  const SizedBox(
                    height: 14,
                  ),
                  _buildRowInfo(
                    'ic_location',
                    farmer.location(),
                  ),
                  const SizedBox(
                    height: 14,
                  ),
                  _buildRowInfo(
                    'ic_land_plot',
                    '${farmer.farmLandsCount ?? 0}',
                  ),
                  const SizedBox(
                    height: 14,
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: _buildRowInfo(
                          'ic_calling',
                          farmer.phoneNumber ?? '',
                        ),
                      ),
                      InkWell(
                        onTap: farmer.phoneNumber != null &&
                                farmer.phoneNumber != ''
                            ? () =>
                                CommonHelper.makePhoneCall(farmer.phoneNumber!)
                            : null,
                        child: Container(
                          height: 24,
                          width: 53,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(5),
                            color: ColorConstant.primary,
                          ),
                          child: Center(
                            child: Text(
                              AppLang.local.call,
                              style: TextStyleConstant.quicksandW500(
                                fontSize: 12,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      )
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Row _buildRowInfo(
    String icon,
    String title,
  ) {
    return Row(
      children: [
        SvgPicture.asset(
          icon.iconSvg,
          width: 16,
          height: 16,
          color: ColorConstant.text79,
        ),
        const SizedBox(
          width: 10,
        ),
        Expanded(
          child: Text(
            title,
            maxLines: null,
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
        )
      ],
    );
  }
}
