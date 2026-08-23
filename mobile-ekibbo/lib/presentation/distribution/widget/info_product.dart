import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/distribution/model_product.dart';

class InfoProduct extends StatelessWidget {
  const InfoProduct(
      {super.key,
      required this.product,
      this.isEdit = true,
      this.isOutOfStock = false,
      required this.onRemove,
      required this.onEdit});
  final MProductItem product;
  final bool isEdit;
  final bool isOutOfStock;
  final Function onRemove;
  final Function onEdit;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: ColorConstant.grayF7F8FA,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              product.product_name,
              style: TextStyleConstant.robotoW600(),
            ),
            const SizedBox(height: 10),
            _buildTextInfo(
              "${AppLang.local.category}: ${product.category_name}",
            ),
            const SizedBox(height: 5),
            _buildTextInfo('${AppLang.local.distribution_stocks}: ${product.quantity}'),
            const SizedBox(height: 5),
            isEdit
                ? _buildTextInfo(
                    '${AppLang.local.available_stock}: ${product.available_stocks}')
                : const SizedBox.shrink(),
            const SizedBox(height: 10),
            RichText(
              text: TextSpan(
                text: '${AppLang.local.total_cost}: ',
                style: TextStyleConstant.robotoW400(),
                children: <TextSpan>[
                  TextSpan(
                    text: "${product.totalCost.toString()}đ",
                    style: TextStyleConstant.robotoW600(),
                  ),
                ],
              ),
            ),
            isEdit ? _buildBtnAction() : const SizedBox.shrink(),
          ],
        ),
      ),
    );
  }

  _buildTextInfo(String text) {
    return Text(
      text,
      style: TextStyleConstant.robotoW400(
        fontSize: 12,
        color: ColorConstant.text79,
      ),
    );
  }

  _buildBtnAction() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            TextButton(
              onPressed: () => onEdit(),
              child: Text(
                AppLang.local.edit,
                style: TextStyleConstant.robotoW400(
                  color: Colors.green,
                ),
              ),
            ),
            TextButton(
              onPressed: () => onRemove(),
              child: Text(
                AppLang.local.remove,
                style: TextStyleConstant.robotoW400(
                  color: Colors.red,
                ),
              ),
            ),
          ],
        ),
        isOutOfStock
            ? Text(
                "Out of stock",
                style: TextStyleConstant.robotoW400(
                  color: Colors.red,
                ),
              )
            : const SizedBox.shrink(),
      ],
    );
  }
}
