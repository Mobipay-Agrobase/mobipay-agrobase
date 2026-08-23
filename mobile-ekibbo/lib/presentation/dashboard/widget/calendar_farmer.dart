import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';

class CalendarFarmer extends StatefulWidget {
  const CalendarFarmer({super.key});

  @override
  State<CalendarFarmer> createState() => _CalendarFarmerState();
}

class _CalendarFarmerState extends State<CalendarFarmer> {
  final DateTime focusedDay = DateTime.now();
  late DateTime selectDay = DateTime.now();

  void _onDaySelected(DateTime selectedDay, DateTime focusedDay) {
    setState(() {
      selectDay = selectedDay;
      focusedDay = focusedDay;
    });
  }

  @override
  Widget build(BuildContext context) {
    return TableCalendar(
      eventLoader: (d) => [],
      onDaySelected: _onDaySelected,
      // selectedDayPredicate: (day) {
      //   return _selectedDays.contains(day);
      // },
      // onPageChanged: (d) {
      //   _focusedDay = d;
      //   _getSchedule(d);
      // },
      firstDay: DateTime.utc(2010, 10, 16),
      lastDay: DateTime.utc(2030, 3, 14),
      focusedDay: focusedDay,
      calendarFormat: CalendarFormat.week,
      selectedDayPredicate: (day) => isSameDay(day, selectDay),
      availableCalendarFormats: const {
        CalendarFormat.week: 'Week',
      },
      daysOfWeekStyle: DaysOfWeekStyle(
        weekdayStyle: TextStyleConstant.robotoW700(
          fontSize: 14,
          color: ColorConstant.text79,
        ),
        weekendStyle: TextStyleConstant.robotoW700(
          fontSize: 14,
          color: ColorConstant.text79,
        ),
      ),
      headerStyle: HeaderStyle(
        titleCentered: true,
        titleTextStyle: TextStyleConstant.robotoW700(fontSize: 16),
        rightChevronIcon: const Icon(
          Icons.chevron_right,
          color: ColorConstant.text79,
        ),
        leftChevronIcon: const Icon(
          Icons.chevron_left,
          color: ColorConstant.text79,
        ),
      ),
      calendarStyle: const CalendarStyle(markersAnchor: 0.4, markerSize: 5),
      calendarBuilders: CalendarBuilders(
        defaultBuilder: (context, day, focusedDay) {
          return SizedBox(
            height: 34,
            width: 34,
            child: Center(
              child: Text(
                day.day.toString(),
                style: TextStyleConstant.robotoW700(
                  fontSize: 14,
                  color: ColorConstant.text79,
                ),
              ),
            ),
          );
        },
        todayBuilder: (context, day, focusedDay) {
          return Container(
            height: 34,
            width: 34,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(4),
              color: ColorConstant.primary.withOpacity(0.5),
            ),
            alignment: Alignment.center,
            child: Text(
              day.day.toString(),
              style: TextStyleConstant.robotoW700(
                fontSize: 11,
                color: Colors.white,
              ),
            ),
          );
        },
        outsideBuilder: (context, day, focusedDay) => Container(
          height: 34,
          width: 34,
          alignment: Alignment.center,
          child: Text(
            day.day.toString(),
            style: TextStyleConstant.robotoW700(
              fontSize: 11,
              color: ColorConstant.text79.withOpacity(0.5),
            ),
          ),
        ),
        selectedBuilder: (context, day, __) {
          //final d = DateHelper.convertDateToStr(day);
          return Container(
            height: 34,
            width: 34,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(4),
              color: day.compareTo(selectDay) == 0
                  ? ColorConstant.blue17A1FA.withOpacity(0.5)
                  : ColorConstant.primary,
            ),
            alignment: Alignment.center,
            child: Text(
              day.day.toString(),
              style: TextStyleConstant.robotoW700(
                fontSize: 11,
                color: Colors.white,
              ),
            ),
          );
        },
      ),
    );
  }
}
