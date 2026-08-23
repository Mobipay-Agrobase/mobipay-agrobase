import 'dart:collection';

import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/srp/srp_schedule_response.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/presentation/srp/widgets/srp_item_view.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class TransactionCalendarScreen extends StatefulWidget {
  const TransactionCalendarScreen({super.key});

  @override
  State<TransactionCalendarScreen> createState() =>
      _TransactionCalendarScreenState();
}

class _TransactionCalendarScreenState extends State<TransactionCalendarScreen> {
  DateTime _focusedDay = DateTime.now();
  //final _searchTxtController = TextEditingController();
  List<SRPActionModel> _datas = [];
  late Set<DateTime> _selectedDays;
  DateTime _selectDay = DateTime.now();
  List<SrpScheduleModel> _days = [];
  int getHashCode(DateTime key) {
    return key.day * 1000000 + key.month * 10000 + key.year;
  }

  //_onSearchChanged(String query) {}

  @override
  void initState() {
    _selectedDays = LinkedHashSet<DateTime>(
      equals: isSameDay,
      hashCode: getHashCode,
    );
    _getDataToday(DateTime.now());
    _getSchedule(DateTime.now());
    super.initState();
  }

  _getDataToday(DateTime date) async {
    final res = await ApiProvider.instance.apiSRP
        .getSRPDate(DateHelper.convertDateToStr(date));
    setState(() {
      _datas = res?.data ?? [];
    });
  }

  _getSchedule(DateTime currentMonth) async {
    _selectedDays.clear();
    _days.clear();
    setState(() {});
    DialogHelper.showLoading();
    final startDate = DateHelper.convertDateToStr(
        DateTime(currentMonth.year, currentMonth.month, 1));
    final endDate = DateHelper.convertDateToStr(currentMonth.lastDayOfMonth);
    final res =
        await ApiProvider.instance.apiSRP.getSchedule(startDate, endDate);
    DialogHelper.hideLoading();
    if (res?.data != null && res!.data!.isNotEmpty) {
      _days = res.data!;
      for (var e in res.data!) {
        _selectedDays.add(e.date!);
      }
      debugPrint(_selectedDays.toString());
      setState(() {});
    }
  }

  void _onDaySelected(DateTime selectedDay, DateTime focusedDay) {
    final now = DateTime.now();
    final v = now.compareTo(selectedDay);
    if (v == -1) {
      _selectDay = selectedDay;
      _getDataToday(selectedDay);
      return;
    }
    final day = DateHelper.convertDateToStr(selectedDay);

    final l = _selectedDays.where((e) => DateHelper.convertDateToStr(e) == day);
    if (l.isNotEmpty) {
      Navigator.of(context)
          .pushNamed(RouterName.list_transaction, arguments: selectedDay);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.transaction_calendar,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Padding(
            //   padding: const EdgeInsets.all(16),
            //   child: AppFormField(
            //     controller: _searchTxtController,
            //     onChanged: _onSearchChanged,
            //     prefixIcon: Padding(
            //       padding: const EdgeInsets.all(16.0),
            //       child: SvgPicture.asset(
            //         'ic_search'.iconSvg,
            //       ),
            //     ),
            //     suffixIcon: InkWell(
            //       onTap: () async {},
            //       child: Padding(
            //         padding: const EdgeInsets.all(16.0),
            //         child: SvgPicture.asset(
            //           'ic_qr'.iconSvg,
            //         ),
            //       ),
            //     ),
            //     hint: '${AppLang.local.search_farmer}...',
            //   ),
            // ),
            TableCalendar(
              onDaySelected: _onDaySelected,
              selectedDayPredicate: (day) {
                return _selectedDays.contains(day);
              },
              onPageChanged: (d) {
                _focusedDay = d;
                _getSchedule(d);
              },
              firstDay: DateTime.utc(2010, 10, 16),
              lastDay: DateTime.utc(2030, 3, 14),
              focusedDay: _focusedDay,
              availableCalendarFormats: const {
                CalendarFormat.month: 'Month',
              },
              daysOfWeekStyle: DaysOfWeekStyle(
                weekdayStyle: TextStyleConstant.robotoW700(
                  fontSize: 16,
                  color: ColorConstant.text79,
                ),
                weekendStyle: TextStyleConstant.robotoW700(
                  fontSize: 16,
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
              calendarBuilders: CalendarBuilders(
                defaultBuilder: (context, day, focusedDay) {
                  return SizedBox(
                    height: 24,
                    width: 24,
                    child: Center(
                      child: Text(
                        day.day.toString(),
                        style: TextStyleConstant.robotoW700(
                          fontSize: 11,
                          color: ColorConstant.text79,
                        ),
                      ),
                    ),
                  );
                },
                todayBuilder: (context, day, focusedDay) {
                  return Container(
                    height: 24,
                    width: 24,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(4),
                      color: ColorConstant.text79,
                    ),
                    child: Center(
                      child: Text(
                        day.day.toString(),
                        style: TextStyleConstant.robotoW700(
                          fontSize: 11,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  );
                },
                outsideBuilder: (context, day, focusedDay) => SizedBox(
                  height: 24,
                  width: 24,
                  child: Center(
                    child: Text(
                      day.day.toString(),
                      style: TextStyleConstant.robotoW700(
                        fontSize: 11,
                        color: ColorConstant.text79.withOpacity(0.5),
                      ),
                    ),
                  ),
                ),
                selectedBuilder: (context, day, __) {
                  final d = DateHelper.convertDateToStr(day);
                  return Container(
                    height: 24,
                    width: 24,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(4),
                      color: _days
                                  .where((e) =>
                                      DateHelper.convertDateToStr(e.date!) == d)
                                  .first
                                  .status ==
                              0
                          ? Colors.red
                          : ColorConstant.primary,
                    ),
                    child: Center(
                      child: Text(
                        day.day.toString(),
                        style: TextStyleConstant.robotoW700(
                          fontSize: 11,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(
              height: 24,
            ),
            Padding(
              padding: const EdgeInsets.only(
                left: 16,
                right: 16,
              ),
              child: Wrap(
                runSpacing: 16,
                children: [
                  _buildNoteColor(Colors.red, 'Missed'),
                  _buildNoteColor(ColorConstant.text79, 'Current Date'),
                  _buildNoteColor(ColorConstant.primary, 'Completed'),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(
                top: 48,
                left: 16,
                right: 16,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Today’s Transaction',
                    style: TextStyleConstant.robotoW600(
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(
                    height: 8,
                  ),
                  Row(
                    children: [
                      SvgPicture.asset('ic_calendar'.iconSvg),
                      const SizedBox(
                        width: 8,
                      ),
                      Text(
                        DateHelper.convertDateToStr(_selectDay,
                            format: 'EEEE, MMM dd yyyy'),
                        style: TextStyleConstant.robotoW400(
                          color: ColorConstant.text79,
                        ),
                      )
                    ],
                  ),
                  _datas.isEmpty
                      ? Padding(
                          padding: const EdgeInsets.all(24),
                          child: Center(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                GImage.asset(
                                  name: 'transaction_empty'.imgPNG,
                                  width: 112,
                                  height: 112,
                                ),
                                const SizedBox(
                                  height: 12,
                                ),
                                Text(
                                  'No transaction found today.',
                                  style: TextStyleConstant.robotoW400(
                                    fontSize: 12,
                                    color: ColorConstant.text79,
                                  ),
                                )
                              ],
                            ),
                          ),
                        )
                      : ListView.builder(
                          itemCount: _datas.length,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          padding: const EdgeInsets.symmetric(vertical: 24),
                          itemBuilder: (_, index) {
                            return SRPItemView(
                              item: _datas[index],
                              onTap: () {
                                final now = DateTime.now();
                                final v = now.compareTo(_selectDay);
                                if (v == -1) {
                                  DialogHelper.showToast(context,
                                      'Do not allow choose the future day');
                                  return;
                                }
                                Navigator.of(context).pushNamed(
                                  RouterName.transaction_detail,
                                  arguments: {
                                    'srp': _datas[index],
                                    'date': DateTime.now(),
                                  },
                                );
                              },
                            );
                          },
                        )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  SizedBox _buildNoteColor(Color color, String title) {
    return SizedBox(
      width: (MediaQuery.of(context).size.width - 32) / 3,
      child: Row(
        children: [
          Container(
            height: 16,
            width: 16,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(4),
              color: color,
            ),
          ),
          const SizedBox(
            width: 8,
          ),
          Text(
            title,
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          )
        ],
      ),
    );
  }
}
