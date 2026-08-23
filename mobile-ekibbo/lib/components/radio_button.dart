import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';

class RadioButton<T> extends StatelessWidget {
  const RadioButton({
    super.key,
    required this.groupValue,
    required this.value,
    this.onChanged,
  });
  final T value;
  final T groupValue;
  final Function(T?)? onChanged;
  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(
        unselectedWidgetColor: ColorConstant.text79.withOpacity(0.5),
      ),
      child: SizedBox(
        height: 15,
        width: 15,
        child: Radio<T>(
          value: value,
          groupValue: groupValue,
          activeColor: ColorConstant.primary,
          onChanged: (v) => onChanged?.call(v),
        ),
      ),
    );
  }
}
