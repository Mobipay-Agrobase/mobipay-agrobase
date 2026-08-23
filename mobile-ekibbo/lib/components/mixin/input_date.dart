import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';

mixin InputDateMixin {
  final dateController = TextEditingController(
      text: DateHelper.convertDateToStr(DateTime.now(), format: "yyyy-MM-dd"));

  DateTime? date;

  Future<void> selectDate(
      BuildContext context, DateTime? lastDate, DateTime? firstDate) async {
    final DateTime? picked = await DateHelper.showDateDialog(
      context,
      initialDate: date ?? DateTime.now(),
      lastDate: lastDate,
      firstDate: firstDate,
    );
    if (picked != null && picked != date) {
      date = picked;
      dateController.text =
          DateHelper.convertDateToStr(date!, format: "yyyy-MM-dd");
    }
  }

  inputDateMixin(BuildContext context,
          {DateTime? lastDate, DateTime? firstDate}) =>
      InkWell(
        onTap: () => selectDate(context, lastDate, firstDate),
        child: IgnorePointer(
          child: AppFormField(
            controller: dateController,
            hint: AppLang.local.date,
            readOnly: true,
            validator: (v) {
              if (v == null || v.isEmpty) {
                return AppLang.local.please_fill_name;
              }
              return null;
            },
            prefixIcon: Padding(
              padding: const EdgeInsets.only(left: 16, right: 16),
              child: SvgPicture.asset('ic_calendar'.iconSvg),
            ),
          ),
        ),
      );
}
