import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/radio_button.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';

class OptionBottomDialog extends StatefulWidget {
  const OptionBottomDialog({
    super.key,
    required this.datas,
    required this.title,
    this.itemSelected,
  });
  final List<String> datas;
  final String title;
  final String? itemSelected;
  @override
  State<OptionBottomDialog> createState() => _OptionBottomDialogState();
}

class _OptionBottomDialogState extends State<OptionBottomDialog> {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 300,
      clipBehavior: Clip.hardEdge,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
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
                    widget.title,
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
              child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: widget.datas.length,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                  ),
                  itemBuilder: (_, index) {
                    return InkWell(
                      onTap: () {
                        Navigator.of(context).pop(index);
                      },
                      child: Container(
                        // height: 52,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: const BoxDecoration(
                            border: Border(
                          bottom: BorderSide(
                            color: ColorConstant.greyEBEBEB,
                          ),
                        )),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                widget.datas[index],
                                style: const TextStyle(
                                  fontSize: 16,
                                  color: ColorConstant.heading,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                            SizedBox(
                              height: 20,
                              width: 20,
                              child: RadioButton<String>(
                                value: widget.datas[index],
                                groupValue: widget.itemSelected ?? '',
                                onChanged: (v) =>
                                  Navigator.of(context).pop(index),
                              ),
                            )
                          ],
                        ),
                      ),
                    );
                  }),
            )
          ],
        ),
      ),
    );
  }
}
