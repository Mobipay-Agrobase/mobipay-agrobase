import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';

// ignore: must_be_immutable
class AppInputTextEdit extends StatelessWidget {
  final String title;
  final String value;

  AppInputTextEdit({super.key, required this.title, required this.value}) {
    quantity = value;
  }

  late String quantity;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      clipBehavior: Clip.hardEdge,
      decoration: const BoxDecoration(
        borderRadius: BorderRadius.only(
            topLeft: Radius.circular(8), topRight: Radius.circular(8)),
        color: Colors.white,
      ),
      child: SafeArea(
        child: Column(
          children: [
            Container(
              height: 52,
              color: ColorConstant.primary,
              padding: const EdgeInsets.only(left: 20, right: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    title,
                    style: TextStyleConstant.quicksandW600(
                      fontSize: 16,
                      color: Colors.white,
                    ),
                  ),
                  InkWell(
                    onTap: Navigator.of(context).pop,
                    child: SvgPicture.asset('ic_close'.iconSvg),
                  )
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: AppFormField(
                  autofocus: true,
                  labelText: 'Enter Quantity',
                  initialValue: quantity,
                  keyboardType: TextInputType.number,
                  onChanged: (v) {
                    quantity = v;
                  },
                  onEditingComplete: () {
                    Navigator.of(context).pop(quantity);
                  },
                  suffixIcon: Padding(
                    padding: const EdgeInsets.only(top: 16, bottom: 16),
                    child: Text(
                      'MT',
                      style: TextStyleConstant.quicksandW600(
                        color: ColorConstant.text79.withOpacity(0.3),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Align(
              alignment: Alignment.bottomCenter,
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16.0, vertical: 5),
                child: AppButton(
                  title: AppLang.local.save,
                  height: 46,
                  onTap: () async {
                    print(quantity);
                    Navigator.of(context).pop(quantity);
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
