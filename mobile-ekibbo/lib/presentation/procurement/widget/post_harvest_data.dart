import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:agrobase_ekibbo/components/pick_photo.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/models/sale_intention/pre_harvest_model.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';

// ignore: must_be_immutable
class PostHarvestDataShow extends StatelessWidget {
  PostHarvestDataShow(
      {super.key,
      required List<MPreHarvestQC> preHarvestQC,
      this.onPressed,
      required this.qcPhotos}) {
    int bettween = (preHarvestQC.length / 2).ceil();
    listOne = preHarvestQC.sublist(0, bettween);
    listTwo = preHarvestQC.sublist(bettween);
  }

  final List<XFile> qcPhotos;

  late List<MPreHarvestQC> listOne;
  late List<MPreHarvestQC> listTwo;
  final Function()? onPressed;
  double widthPhoto = (NavigatorManager.size.width - 100) / 2;

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
          child: Column(
            children: [
              Row(
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
                                child: _buildItemInfo(e.description, e.value),
                              ))
                          .toList(),
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Wrap(
                  direction: Axis.horizontal,
                  alignment: WrapAlignment.spaceBetween,
                  spacing: 10,
                  runSpacing: 10,
                  children: qcPhotos
                      .map(
                        (e) => WPickPhoto(
                          photo: e,
                          width: widthPhoto,
                        ),
                      )
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
