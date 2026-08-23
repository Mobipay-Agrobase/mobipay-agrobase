import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

class FarmerList extends StatelessWidget {
  const FarmerList({super.key, required this.farmerList});
  final List<FarmerModel> farmerList;

  @override
  Widget build(BuildContext context) {
    return Column(
        children:
            farmerList.map((item) => FarmerItem(farmerItem: item)).toList());
  }
}

class FarmerItem extends StatelessWidget {
  const FarmerItem({super.key, required this.farmerItem});
  final FarmerModel farmerItem;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.of(context)
          .pushNamed(RouterName.farmer_detail, arguments: farmerItem.id),
      child: Container(
        // height: 130,
        padding: const EdgeInsets.only(
          left: 20,
          right: 16,
          top: 24,
          bottom: 18,
        ),
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(15),
          color: ColorConstant.grayF7F8FA,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GInternetImage(
              url: farmerItem.avatarUrl,
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
                          farmerItem.fullName ?? '',
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
                  const SizedBox(height: 16),
                  _buildItemInfo('ic_#', farmerItem.farmerCode ?? ''),
                  // const SizedBox(height: 14),
                  // _buildItemInfo('ic_location', farmerItem.location()),
                  const SizedBox(height: 14),
                  _buildItemInfo('ic_calling', farmerItem.phoneNumber ?? ''),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  _buildItemInfo(String icon, String text) {
    return Row(
      children: [
        SvgPicture.asset(icon.iconSvg),
        const SizedBox(
          width: 10,
        ),
        Text(
          text,
          style: TextStyleConstant.robotoW400(
            fontSize: 12,
            color: ColorConstant.text79,
          ),
        )
      ],
    );
  }
}
