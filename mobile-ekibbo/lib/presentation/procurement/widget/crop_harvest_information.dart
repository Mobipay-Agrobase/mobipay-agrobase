import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/presentation/procurement/models/crop_harvest_model.dart';

class CropHarvestInformation extends StatelessWidget {
  const CropHarvestInformation(
      {super.key, required this.mCropHarvest, this.edit, this.remove});
  final MCropHarvest mCropHarvest;
  final Function? edit;
  final Function? remove;

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
                    AppLang.local.crop_cultivated,
                    mCropHarvest.cropName,
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 15),
                    child: _buildItemInfo(
                      AppLang.local.cultivated_area,
                      "${mCropHarvest.cultivatedArea}ha",
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
                      AppLang.local.variety,
                      mCropHarvest.cultivationName,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 15),
                    child: _buildItemInfo(
                      AppLang.local.sub_total,
                      "${mCropHarvest.subTotal}đ",
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
              onPressed: () => edit!(),
              child: Text(
                AppLang.local.edit,
                style: TextStyleConstant.robotoW400(
                  color: Colors.green,
                ),
              ),
            ),
            TextButton(
              onPressed: () => remove!(),
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
