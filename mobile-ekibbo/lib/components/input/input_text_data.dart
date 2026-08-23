import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';

// ignore: must_be_immutable
class InputTextData extends StatefulWidget {
  const InputTextData(
      {super.key,
      required this.hintText,
      this.errorText,
      this.initValue,
      this.readOnly = false,
      this.onChange});

  final String hintText;
  final String? errorText;
  final String? initValue;
  final bool readOnly;
  final Function(String)? onChange;

  @override
  State<InputTextData> createState() => _InputTextDataState();
}

class _InputTextDataState extends State<InputTextData> {

  @override
  Widget build(BuildContext context) {
    return AppFormField(
      readOnly: widget.readOnly,
      hint: widget.hintText,
      initialValue: widget.initValue,
      onChanged: widget.onChange,
      validator: (v) {
        if (v == null || v.isEmpty) {
          return widget.errorText;
        }
        return null;
      },
    );
  }
}
