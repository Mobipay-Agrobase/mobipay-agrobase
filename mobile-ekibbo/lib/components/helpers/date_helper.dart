import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';

class DateHelper {
  static String convertDateToStr(DateTime date,
      {String format = 'dd/MM/yyyy'}) {
    return DateFormat(format).format(date);
  }

  static DateTime convertStrToDate(String date,
      {String format = 'dd/MM/yyyy'}) {
    return DateFormat(format).parse(date);
  }

  static int convertDateToTimestamp(DateTime date) {
    return date.millisecondsSinceEpoch ~/ 1000;
  }
  

  static DateTime convertTimestampToDate(int date) {
    return DateTime.fromMillisecondsSinceEpoch(date);
  }

  static Future<DateTime?> showDateDialog(
    BuildContext context, {
    required DateTime initialDate,
    DateTime? firstDate,
    DateTime? lastDate,
  }) {
    return showDatePicker(
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: ColorConstant.primary, // header background color
              onPrimary: Colors.white, // header text color
              onSurface: Colors.green, // body text color
            ),
          ),
          child: child!,
        );
      },
      context: context,
      initialDate: initialDate,
      firstDate: firstDate ?? DateTime(2015, 8),
      lastDate: lastDate ?? DateTime(2101),
    );
  }

  static Future<TimeOfDay?> showTimeDialog(
    BuildContext context, {
    required TimeOfDay initialTime,
  }) {
    return showTimePicker(
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: ColorConstant.primary, // header background color
              onPrimary: Colors.white, // header text color
              onSurface: Colors.green, // body text color
            ),
          ),
          child: child!,
        );
      },
      context: context,
      initialTime: initialTime,
    );
  }
}

extension DateTimeExtension on DateTime {
  DateTime get firstDayOfWeek => subtract(Duration(days: weekday - 1));

  DateTime get lastDayOfWeek =>
      add(Duration(days: DateTime.daysPerWeek - weekday));

  DateTime get lastDayOfMonth =>
      month < 12 ? DateTime(year, month + 1, 0) : DateTime(year + 1, 1, 0);
}
