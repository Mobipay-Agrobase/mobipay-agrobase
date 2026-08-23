import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';

class MultipleChoicesView extends StatelessWidget {
  const MultipleChoicesView({
    super.key,
    required this.title,
    required this.datas,
    required this.itemsSelected,
    this.onChanged,
  });
  final String title;
  final List<String> datas;
  final List<String> itemsSelected;
  final Function(String)? onChanged;
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyleConstant.robotoW600(fontSize: 16),
          ),
          const SizedBox(
            height: 12,
          ),
          Wrap(
            runSpacing: 10,
            spacing: 16,
            children: datas
                .map(
                  (e) => InkWell(
                    onTap: () => onChanged?.call(e),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 10),
                      decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(5),
                          color: ColorConstant.grayF6F7F9,
                          border: itemsSelected.contains(e)
                              ? Border.all(color: ColorConstant.primary)
                              : null),
                      child: Text(
                        e,
                        style: TextStyleConstant.robotoW400(
                          color: itemsSelected.contains(e)
                              ? ColorConstant.primary
                              : Colors.black,
                        ),
                      ),
                    ),
                  ),
                )
                .toList(),
          )
        ],
      ),
    );
  }
}
