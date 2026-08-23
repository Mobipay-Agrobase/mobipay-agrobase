import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';

class NoDataView extends StatelessWidget {
  const NoDataView({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        AppLang.local.no_data_available,
        style: TextStyleConstant.quicksandW500(
          color: ColorConstant.text79,
          fontSize: 16,
        ),
      ),
    );
  }
}
