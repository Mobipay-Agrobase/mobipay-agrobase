import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/mixin/input_date.dart';

// ignore: must_be_immutable
class InputDateWidget extends StatefulWidget {
  InputDateWidget(
      {super.key, required this.initValue, required this.onSelectDate});
  final String initValue;
  Function(String value)? onSelectDate;

  @override
  State<InputDateWidget> createState() => _InputDateWidgetState();
}

class _InputDateWidgetState extends State<InputDateWidget> with InputDateMixin {
  @override
  void initState() {
    super.initState();
    dateController.text = widget.initValue;
  }

  @override
  void dispose() {
    dateController.dispose();
    super.dispose();
  }

  // @override
  // Future<void> selectDate(BuildContext context) async {
  //   await super.selectDate(context, null, null);
  //   if (widget.onSelectDate == null) return;
  //   widget.onSelectDate!(dateController.text);
  // }

  @override
  Widget build(BuildContext context) {
    return inputDateMixin(context);
  }
}
