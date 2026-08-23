import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:image_picker/image_picker.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';

// ignore: must_be_immutable
class WPickPhoto extends StatelessWidget {
  WPickPhoto(
      {super.key,
      this.photo,
      this.onChossed,
      this.remove,
      this.width = double.infinity,
      this.isChanged = false});

  XFile? photo;
  Function(XFile? photo)? onChossed;
  Function()? remove;
  double width;
  bool isChanged;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        InkWell(
          onTap: () async {
            if (!isChanged) return;
            photo = await CommonHelper.chooseImgOptions(context);
            onChossed!(photo);
          },
          child: Container(
            height: 94,
            width: width,
            clipBehavior: Clip.hardEdge,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              color: ColorConstant.grayF6F7F9,
            ),
            child: photo != null
                ? GImage.file(file: File(photo!.path))
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SvgPicture.asset(
                        'ic_bold_camera'.iconSvg,
                      ),
                      const SizedBox(
                        height: 4,
                      ),
                      Text(
                        AppLang.local.choose_photo,
                        style: TextStyleConstant.quicksandW600(
                          color: ColorConstant.text79,
                        ),
                      )
                    ],
                  ),
          ),
        ),
        remove == null
            ? const SizedBox.shrink()
            : Positioned(
                right: 1,
                child: InkWell(
                  onTap: () => remove!(),
                  child: Container(
                    decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(10)),
                    child: const Padding(
                      padding: EdgeInsets.all(5.0),
                      child: Icon(
                        Icons.close,
                        size: 10,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
      ],
    );
  }
}
