import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';
import 'package:agrobase_ekibbo/models/sale_intention/pre_harvest_model.dart';

// ignore: must_be_immutable
class PreHarvestDataShow extends StatelessWidget {
  PreHarvestDataShow(
      {super.key, required List<MPreHarvestQC> preHarvestQC, this.onPressed}) {
    int bettween = (preHarvestQC.length / 2).ceil();
    listOne = preHarvestQC.sublist(0, bettween);
    listTwo = preHarvestQC.sublist(bettween);
  }

  late List<MPreHarvestQC> listOne;
  late List<MPreHarvestQC> listTwo;
  final Function()? onPressed;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onPressed!(),
      child: Container(
        decoration: BoxDecoration(
          color: ColorConstant.grayF6F7F9,
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
                  children: listOne
                      .map((e) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: _buildItemInfo(e.description, e.value),
                          ))
                      .toList(),
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: listTwo
                      .map((e) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: _buildItemInfo(
                                e.getDescription(
                                    SharedPreferencesProvider.instance.appLang),
                                e.value),
                          ))
                      .toList(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildItemInfo(String key, String value) {
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
        const SizedBox(height: 5),
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
