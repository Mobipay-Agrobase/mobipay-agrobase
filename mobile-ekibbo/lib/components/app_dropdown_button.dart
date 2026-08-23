import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/option_bottom_dialog.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/presentation/carbon/screens/note_dialog.dart';

class AppDropdownButton extends StatelessWidget {
  const AppDropdownButton({
    super.key,
    this.hintText,
    required this.items,
    this.onChanged,
    this.itemSelected,
    this.error,
    this.isDisable = false,
    this.bgColor,
    this.isHideArrow = false,
    this.isShowInfo = false,
    this.description,
  });
  final String? hintText;
  final List<String> items;
  final String? itemSelected;
  final String? error;
  final bool isDisable;
  final Color? bgColor;
  final bool isHideArrow;
  final bool isShowInfo;
  final Function(int)? onChanged;
  final String? description;
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        if (isDisable) {
          return;
        }
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
            if (items[value] == itemSelected) {
              return;
            }
            onChanged?.call(value);
          }
        });
      },
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 48,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      color: bgColor ?? ColorConstant.grayF6F7F9,
                      border:
                          error != null ? Border.all(color: Colors.red) : null),
                  child: Row(
                    children: [
                      if (hintText != null) ...[
                        Text(
                          hintText!,
                          style: TextStyleConstant.worksansW500(
                            color: ColorConstant.gray6C757D,
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Expanded(
                        child: Text(
                          itemSelected ?? '',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyleConstant.worksansW500(
                            color: isDisable
                                ? ColorConstant.gray6C757D
                                : ColorConstant.heading,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      if (!isHideArrow)
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
          ),
          if (isShowInfo)
            InkWell(
              onTap: () => showDialog(
                context: context,
                builder: (_) => NoteDialog(
                  title: hintText ?? '',
                  description: description ?? '',
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.only(left: 16),
                child: SvgPicture.asset('ic_info'.iconSvg),
              ),
            )
        ],
      ),
    );
  }
}
