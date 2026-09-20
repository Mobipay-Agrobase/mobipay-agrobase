import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:mobipay_ekibbo/components/option_bottom_dialog.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';

class AppDropwdownButton extends StatelessWidget {
  const AppDropwdownButton({
    super.key,
    this.hintText,
    required this.items,
    this.onChanged,
    this.itemSelected,
    this.error,
  });
  final String? hintText;
  final List<String> items;
  final String? itemSelected;
  final String? error;

  final Function(int)? onChanged;
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        showModalBottomSheet(
          context: context,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          builder: (_) => OptionBottomDialog(
            title: hintText ?? '',
            datas: items,
            itemSelected: itemSelected,
          ),
        ).then((value) {
          if (value != null) {
            onChanged?.call(value);
          }
        });
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 48,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: ColorConstant.grayF6F7F9,
                border: error != null ? Border.all(color: Colors.red) : null),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    itemSelected != null ? itemSelected! : (hintText ?? ''),
                    style: TextStyleConstant.worksansW500(
                        color: ColorConstant.gray6C757D),
                  ),
                ),
                SvgPicture.asset(
                  'assets/icons/ic_caret_up.svg',
                )
              ],
            ),
          ),
          if (error != null)
            Padding(
              padding: const EdgeInsets.only(top: 4, left: 16),
              child: Text(
                error!,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.red,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
