// ignore_for_file: use_build_context_synchronously

import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/models/question_srp/question_srp_model.dart';
import 'package:agrobase_ekibbo/models/srp/srp_schedule_response.dart';
import 'package:agrobase_ekibbo/presentation/srp/models/question_section_model.dart';
import 'package:agrobase_ekibbo/presentation/srp/widgets/survey_view.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class WaterIrrigationScreen extends StatefulWidget {
  const WaterIrrigationScreen({
    super.key,
    required this.date,
    required this.srp,
    required this.listWaterIrr,
  });
  final SRPActionModel srp;
  final DateTime date;
  final List<SRPActionModel> listWaterIrr;
  @override
  State<WaterIrrigationScreen> createState() => _WaterIrrigationScreenState();
}

class _WaterIrrigationScreenState extends State<WaterIrrigationScreen> {
  List<QuestionSrpModel> _questions = [];
  // List<QuestionSrpModel> _questionsOriginal = [];
  int _indexSelected = 0;
  @override
  void initState() {
    super.initState();
    if (widget.listWaterIrr[_indexSelected].is_finished == 1) {
      _getDataRemote();
    } else {
      _getData();
    }
  }

  _getDataRemote() async {
    _questions.clear();
    final res = await ApiProvider.instance.apiSRP.getWaterIrrigationForm(
        DateHelper.convertDateToStr(
            widget.listWaterIrr[_indexSelected].date_action!),
        widget.srp.srp_id!);
    if (res?.data != null) {
      for (var e in res!.data!) {
        _questions.add(QuestionSrpModel(
          key: e.question,
          questionTitle: e.title,
          type: e.type,
          answer: AnswerModel(answer: e.answer),
        ));
      }
    }
    setState(() {});
  }

  _getData() async {
    _questions.clear();
    final res =
        await rootBundle.loadString('assets/data/water_irrigation.json');
    final data = List<Map<String, dynamic>>.from(jsonDecode(res));

    _questions = data.map((e) {
      final o = QuestionSrpModel.fromJson(e);
      if (o.type == QuestionType.date_picker.name) {
        o.answer =
            AnswerModel(answer: DateHelper.convertDateToStr(DateTime.now()));
      } else if (o.key == 'round_of_irrigation') {
        o.options = List.generate(
          30,
          (index) => OptionModel(
            title: '${index + 1}',
          ),
        );
      }
      return o;
    }).toList();

    setState(() {});
  }

  _onSave() async {
    var map1 = <String, dynamic>{};
    List<Map<String, dynamic>> arrMap = [];
    var map2 = <String, dynamic>{};
    for (var e in _questions) {
      if (e.section == 'other_information') {
        if (e.answer != null) {
          map1[e.key!] = e.answer?.toJson(
            section: e.section,
            title: e.questionTitle,
            type: e.type,
          );
        }
      } else if (e.section == 'input_used') {
        map1[e.key!] = e.answer?.toJson(
          section: e.section,
          title: e.questionTitle,
          type: e.type,
        );
      } else if (e.section == 'labour_and_cost_details') {
        if (e.answer?.answer?.toLowerCase() != 'labour' &&
            e.answer?.answer?.toLowerCase() != 'machine' &&
            e.key == 'activity_done_by') {
          map2[e.key!] = e.answer?.toJson(
            section: e.section,
            title: e.questionTitle,
            type: e.type,
          );
          arrMap.add(map2);
        } else if (e.key == 'activity_done_by') {
          map2[e.key!] = e.answer?.toJson(
            section: e.section,
            title: e.questionTitle,
            type: e.type,
          );
        } else if ((map2['labour_gender'] == null ||
                map2['labour_total_cost'] == null) &&
            map2['activity_done_by']['answer'] == 'Labour') {
          map2[e.key!] = e.answer?.toJson(
            section: e.section,
            title: e.questionTitle,
            type: e.type,
          );
        } else if (map2['machine_name'] == null ||
            map2['machine_ownership'] == null &&
                map2['activity_done_by']['answer'] == 'Machine') {
          map2[e.key!] = e.answer?.toJson(
            section: e.section,
            title: e.questionTitle,
            type: e.type,
          );
        } else if (map2['machine_ownership'] != null &&
            map2['machine_ownership']['answer'] == 'Rental') {
          if (map2['machine_total_cost'] == null) {
            map2[e.key!] = e.answer?.toJson(
              section: e.section,
              title: e.questionTitle,
              type: e.type,
            );
          } else {
            arrMap.add(map2);
            final ans = map2['activity_done_by'];
            map2 = {};
            map2['activity_done_by'] = ans;
            map2[e.key!] = e.answer?.toJson(
              section: e.section,
              title: e.questionTitle,
              type: e.type,
            );
          }
        } else {
          arrMap.add(map2);
          final ans = map2['activity_done_by'];
          map2 = {};
          map2['activity_done_by'] = ans;
          map2[e.key!] = e.answer?.toJson(
            section: e.section,
            title: e.questionTitle,
            type: e.type,
          );
        }
      }
    }
    if (map2.length > 1) {
      arrMap.add(map2);
    }
    arrMap.add(map1);

    Map<String, dynamic> data = {
      "farmer_id": widget.srp.srp?.farmer_id,
      "cultivation_id": widget.srp.srp?.cultivation_id,
      "srp_id": widget.srp.srp_id,
      'data_question_answer_group': arrMap,
      'date_action': DateHelper.convertDateToStr(
          widget.listWaterIrr[_indexSelected].date_action!),
    };
    final res =
        await ApiProvider.instance.apiSRP.submitWaterIrrigationForm(data);
    if (res?.result == true) {
      Navigator.of(context).pop(true);
      DialogHelper.showToast(context,
          'SRP ${QuestionSectionType.waterIrrigation.title} Created Successfully');
    }
  }

  @override
  Widget build(BuildContext context) {
    return SurveyView(
      optionWidget: Padding(
        padding: const EdgeInsets.all(16.0),
        child: AppDropdownButton(
          hintText: 'Choose date',
          itemSelected: DateHelper.convertDateToStr(
              widget.listWaterIrr[_indexSelected].date_action!),
          items: widget.listWaterIrr
              .map((e) => DateHelper.convertDateToStr(e.date_action!))
              .toList(),
          onChanged: (v) {
            setState(() {
              _indexSelected = v;
              if (widget.listWaterIrr[_indexSelected].is_finished == 1) {
                _getDataRemote();
              } else {
                _getData();
              }
            });
          },
        ),
      ),
      title: QuestionSectionType.waterIrrigation.title,
      questions: _questions,
      onChangedDropdown: (r, i) {
        if (i + 1 >= _questions.length) {
          _questions.addAll(_questions[i].getSubQuestions(r));
        } else {
          _questions.insertAll(i + 1, _questions[i].getSubQuestions(r));
        }

        if (_questions[i].parent == null &&
            _questions[i].key == 'activity_done_by') {
          _questions.removeWhere((e) => e.parent != null && e.parent != r);
        } else {
          _questions.removeSubList(_questions[i]
              .getSubQuestions(_questions[i].answer?.answer ?? ''));
        }

        _questions[i].answer = AnswerModel(
          answer: r,
          score: _questions[i].getScore(r),
        );
        setState(() {});
      },
      onChangedTextField: (v, i) {
        _questions[i].answer = AnswerModel(answer: v);
        if (_questions[i].key == 'labour_man_days') {
          final seedCost =
              _getLabourCost(v, _questions[i + 1].answer?.answer ?? '');
          _questions[i + 2].answer = AnswerModel(answer: seedCost.toString());
        } else if (_questions[i].key == 'labour_wages_per_day') {
          final seedCost =
              _getLabourCost(_questions[i - 1].answer?.answer ?? '', v);
          _questions[i + 1].answer = AnswerModel(answer: seedCost.toString());
        } else if (_questions[i].key == 'disel_total_liter_used') {
          final seedCost =
              _getLabourCost(v, _questions[i + 1].answer?.answer ?? '');
          _questions[i + 2].answer = AnswerModel(answer: seedCost.toString());
        } else if (_questions[i].key == 'disel_per_liter_cost') {
          final seedCost =
              _getLabourCost(_questions[i - 1].answer?.answer ?? '', v);
          _questions[i + 1].answer = AnswerModel(answer: seedCost.toString());
        } else if (_questions[i].key == 'electricity_tota_iIrrigated_hours') {
          final seedCost =
              _getLabourCost(v, _questions[i + 1].answer?.answer ?? '');
          _questions[i + 2].answer = AnswerModel(answer: seedCost.toString());
        } else if (_questions[i].key == 'electricity_unit_cost') {
          final seedCost =
              _getLabourCost(_questions[i - 1].answer?.answer ?? '', v);
          _questions[i + 1].answer = AnswerModel(answer: seedCost.toString());
        }
        // else if (_questions[i].key == 'sowing_charges') {
        //   // [plot area * sowing charges]
        //   final s = (double.tryParse(v) ?? 0) * 20;
        //   _questions[i + 1].answer = AnswerModel(answer: s.toString());
        // }
        setState(() {});
      },
      onSave: _onSave,
      onAdd: (i) {
        final l = _questions[i].getSubQuestions(_questions[i].answer!.answer!);
        _questions.addAll(l);
        setState(() {});
      },
      hideSave: widget.listWaterIrr[_indexSelected].is_finished == 1,
      onChangedFile: (f, i) {
        _questions[i].answer = AnswerModel(
          answer: f,
        );
        setState(() {});
      },
    );
  }

  double _getLabourCost(String q, String p) {
    final numQ = double.tryParse(q) ?? 0;
    final numP = double.tryParse(p) ?? 0;
    return numQ * numP;
  }
}
