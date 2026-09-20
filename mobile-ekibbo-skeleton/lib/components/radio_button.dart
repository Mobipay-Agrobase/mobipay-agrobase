import 'package:flutter/material.dart';
import 'package:upstream/constant/color_constant.dart';

class RadioButton<T> extends StatelessWidget {
  const RadioButton({
    super.key,
    required this.groupValue,
    required this.value,
  });
  final T value;
  final T groupValue;
  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(
        unselectedWidgetColor: ColorConstant.primary,
      ),
      child: SizedBox(
        height: 15,
        width: 15,
        child: Radio<T>(
          value: value,
          groupValue: groupValue,
          activeColor: ColorConstant.primary,
          onChanged: (v) {},
        ),
      ),
    );
  }
}
