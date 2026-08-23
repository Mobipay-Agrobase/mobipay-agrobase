import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';

class DateFormField extends StatefulWidget {
  const DateFormField({
    super.key,
    this.hint,
    required this.initialDate,
    this.onChanged,
    this.firstDate,
    this.validatorStr,
    this.isTimePicker = false,
    this.initialTime,
    this.onChangedTime,
    this.isDisable = false,
  });
  final String? hint;
  final DateTime initialDate;
  final Function(DateTime)? onChanged;
  final Function(String)? onChangedTime;
  final String? validatorStr;
  final DateTime? firstDate;
  final bool isTimePicker;
  final String? initialTime;
  final bool isDisable;
  @override
  State<DateFormField> createState() => _DateFormFieldState();
}

class _DateFormFieldState extends State<DateFormField> {
  late DateTime _initialDate;
  final _controller = TextEditingController();
  @override
  void initState() {
    super.initState();
    _initialDate = widget.initialDate;
    _controller.text = widget.initialTime != null
        ? widget.initialTime!
        : DateHelper.convertDateToStr(_initialDate);
  }

  Future<void> _selectDate() async {
    if (widget.isDisable) {
      return;
    }
    if (widget.isTimePicker) {
      final picked = await DateHelper.showTimeDialog(context,
          initialTime: TimeOfDay.now());
      if (picked != null) {
        // _initialDate = picked;
        _controller.text = DateHelper.convertDateToStr(_initialDate);
        widget.onChangedTime?.call('${picked.hour}:${picked.minute}');
        _controller.text = '${picked.hour}:${picked.minute}';
      }
      return;
    }
    final DateTime? picked = await DateHelper.showDateDialog(
      context,
      initialDate: _initialDate,
      lastDate: DateTime(2100, 1),
      firstDate: widget.firstDate ?? DateTime(1900, 1),
    );
    if (picked != null && picked != _initialDate) {
      _initialDate = picked;
      _controller.text = DateHelper.convertDateToStr(_initialDate);
      widget.onChanged?.call(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: _selectDate,
      child: IgnorePointer(
        child: AppFormField(
          controller: _controller,
          labelText: widget.hint,
          readOnly: true,
          prefixIcon: Padding(
            padding: const EdgeInsets.only(left: 16, right: 16),
            child: SvgPicture.asset('ic_calendar'.iconSvg),
          ),
          validator: widget.validatorStr == null
              ? null
              : (v) {
                  if (v == null || v.isEmpty) {
                    return widget.validatorStr;
                  }
                  return null;
                },
        ),
      ),
    );
  }
}
