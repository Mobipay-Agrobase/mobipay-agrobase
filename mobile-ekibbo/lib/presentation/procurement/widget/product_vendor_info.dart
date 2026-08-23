import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/notifications/order/order_notification.dart';

class WProductVendorInfo extends StatelessWidget {
  const WProductVendorInfo({super.key, required this.order});
  final MOrderResponse? order;

  @override
  Widget build(BuildContext context) {
    return order == null
        ? const SizedBox.shrink()
        : Container(
            decoration: BoxDecoration(
              color: ColorConstant.grayF7F8FA,
              borderRadius: BorderRadius.circular(15),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildItemInfo(
                          "Product Name",
                          order!.order.orderDetail[0].productName,
                        ),
                        Padding(
                          padding: const EdgeInsets.only(top: 15),
                          child: _buildItemInfo(
                            AppLang.local.farmer,
                            order!.order.sellerId.toString(),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.only(top: 15),
                          child: _buildItemInfo(
                            "Ordered Quantities",
                            "${order!.order.orderDetail[0].quantity} ${order!.order.orderDetail[0].unit}",
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
                            AppLang.local.date,
                            order!.order.createdAt.split("T")[0],
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.only(top: 15),
                          child: _buildItemInfo(
                            "Sale Intention Id",
                            order!.order.orderDetail[0].saleIntentionId
                                .toString(),
                          ),
                        ),
                      ],
                    ),
                  ),
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
