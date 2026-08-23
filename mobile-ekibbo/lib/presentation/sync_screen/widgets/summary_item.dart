// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/presentation/dashboard/widget/summary_item_vertical.dart';

class SummaryItem extends StatelessWidget {
  final String title;
  final String value;
  final Function onPressed;

  const SummaryItem({
    Key? key,
    required this.title,
    required this.value,
    required this.onPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onPressed(),
      child: SummaryItemVertical(
        title: title,
        value: value,
        icon: SvgPicture.asset(
          'ic_sync'.iconSvg,
          color: ColorConstant.primary,
        ),
      ),
    );
  }
}
