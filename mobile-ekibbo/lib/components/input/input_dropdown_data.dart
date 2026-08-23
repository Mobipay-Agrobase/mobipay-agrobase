import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';

// ignore: must_be_immutable
class InputDropDownData extends StatefulWidget {
  InputDropDownData(
      {super.key,
      required this.items,
      required this.hintText,
      this.itemIndex,
      required this.onChanged});

  final List<String> items;
  final String hintText;
  final Function(int) onChanged;
  int? itemIndex;

  @override
  State<InputDropDownData> createState() => _InputDropDownDataState();
}

class _InputDropDownDataState extends State<InputDropDownData> {
  @override
  Widget build(BuildContext context) {
    return AppDropdownButton(
      hintText: widget.hintText,
      items: widget.items,
      itemSelected:
          widget.itemIndex == null ? '' : widget.items[widget.itemIndex!],
      onChanged: (index) {
        widget.onChanged(index);
        setState(() {
          widget.itemIndex = index;
        });
      },
    );
  }
}
