import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';

class WidgetCommon {
  static buildHeaderForm(String title) => Row(
        children: [
          Text(
            title,
            style: TextStyleConstant.robotoW800(
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            width: 10,
          ),
          Expanded(
            child: Container(
              height: 1,
              color: ColorConstant.greyEBEBEB,
            ),
          )
        ],
      );

  static buildBGDashboard() {
    return Container(
      height: 225,
      decoration: const BoxDecoration(
        color: ColorConstant.primary,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(40),
          bottomRight: Radius.circular(40),
        ),
      ),
    );
  }

  static noDataView(BuildContext context, {Function()? onPressed}) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text(
          'No data available!',
          style: TextStyle(color: ColorConstant.text79),
        ),
        onPressed == null
            ? const SizedBox.shrink()
            : IconButton(
                onPressed: onPressed,
                icon: const Icon(
                  Icons.refresh,
                  color: ColorConstant.text79,
                ),
              )
      ],
    );
  }
}
