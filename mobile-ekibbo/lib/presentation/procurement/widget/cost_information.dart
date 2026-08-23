import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/presentation/procurement/models/cost_procurement_model.dart';

// ignore: must_be_immutable
class CostInformation extends StatelessWidget {
  const CostInformation(
      {super.key, required this.cost, this.onRemove, this.onEdit});
  final MProcurementCost cost;
  final Function()? onRemove;
  final Function()? onEdit;

  @override
  Widget build(BuildContext context) {
    return Container(
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
                    AppLang.local.item,
                    cost.itemName,
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 15),
                    child: _buildItemInfo(
                      AppLang.local.rate,
                      "${cost.rate}đ",
                    ),
                  ),
                  _buildBtnAction(),
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
                      AppLang.local.quantity,
                      "${cost.quantity}MT",
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 15),
                    child: _buildItemInfo(
                      AppLang.local.total_cost,
                      "${cost.subTotal}đ",
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

  _buildBtnAction() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            TextButton(
              onPressed: () => onEdit!(),
              child: Text(
                AppLang.local.edit,
                style: TextStyleConstant.robotoW400(
                  color: Colors.green,
                ),
              ),
            ),
            TextButton(
              onPressed: () => onRemove!(),
              child: Text(
                AppLang.local.remove,
                style: TextStyleConstant.robotoW400(
                  color: Colors.red,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
