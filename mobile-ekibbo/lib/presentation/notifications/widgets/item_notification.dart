import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/models/notifications/notification_model.dart';
import 'package:agrobase_ekibbo/models/notifications/order/order_notification.dart';

class WNotificationItem extends StatelessWidget {
  const WNotificationItem({super.key, required this.item});
  final MNotification<MOrderNotification> item;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: ColorConstant.grayF6F7F9,
          ),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 15, top: 15),
        child: Row(
          children: [
            SvgPicture.asset(
              "ic_notification".iconSvg,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildItemInfo('Order Placed', item.data!.code),
            )
          ],
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
            fontSize: 14,
            color: ColorConstant.text79,
          ),
        ),
        const SizedBox(height: 8),
        RichText(
          text: TextSpan(
            children: [
              TextSpan(
                text: 'Orders code ',
                style: TextStyleConstant.robotoW400(
                  fontSize: 12,
                  color: ColorConstant.text79,
                ),
              ),
              TextSpan(
                text: value,
                style: TextStyleConstant.robotoW400(
                  fontSize: 12,
                  color: ColorConstant.primary,
                ),
              ),
              TextSpan(
                text: ' has been placed',
                style: TextStyleConstant.robotoW400(
                  fontSize: 12,
                  color: ColorConstant.text79,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
