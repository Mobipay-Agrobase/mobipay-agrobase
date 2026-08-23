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

class PesticideApplicationScreen extends StatefulWidget {
  const PesticideApplicationScreen({
    super.key,
    required this.date,
    required this.srp,
    required this.listDatas,
  });
  final SRPActionModel srp;
  final DateTime date;
  final List<SRPActionModel> listDatas;
  @override
  State<PesticideApplicationScreen> createState() =>
      _PesticideApplicationScreenState();
}

class _PesticideApplicationScreenState
    extends State<PesticideApplicationScreen> {
  List<QuestionSrpModel> _questions = [];
  int _index = 0;
  @override
  void initState() {
    super.initState();
    if (widget.listDatas[_index].is_finished == 1) {
      _getDataRemote();
    } else {
      _getData();
    }
  }

  _getDataRemote() async {
    _questions.clear();
    final res = await ApiProvider.instance.apiSRP.getPesticideApplicationForm(
        DateHelper.convertDateToStr(widget.listDatas[_index].date_action!),
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
        await rootBundle.loadString('assets/data/pesticide_application.json');
    final data = List<Map<String, dynamic>>.from(jsonDecode(res));
    _questions = data.map((e) {
      final o = QuestionSrpModel.fromJson(e);
      if (o.type == QuestionType.date_picker.name) {
        o.answer =
            AnswerModel(answer: DateHelper.convertDateToStr(DateTime.now()));
      } else if (o.type == QuestionType.time_picker.name) {
        o.answer = AnswerModel(
          answer: '${TimeOfDay.now().hour}:${TimeOfDay.now().minute}',
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
      if (e.section == 'pesticide_application_information') {
        if (e.answer != null) {
          map1[e.key!] = e.answer?.toJson(
            section: e.section,
            title: e.questionTitle,
            type: e.type,
          );
        }
      } else if (e.section == 'pesticide_details' &&
              map2['pesticide_mixed'] == null ||
          map2['cost_of_the_pesticide'] == null) {
        if (e.answer != null) {
          map2[e.key!] = e.answer?.toJson(
            section: e.section,
            title: e.questionTitle,
            type: e.type,
          );
        }

        if (map2['cost_of_the_pesticide'] != null) {
          arrMap.add(map2);
          map2 = {};
        }
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
          map2 = {};
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
          if (ans != null) {
            map2['activity_done_by'] = ans;
          }

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
      'date_action':
          DateHelper.convertDateToStr(widget.listDatas[_index].date_action!),
    };
    debugPrint(data.toString());
    final res =
        await ApiProvider.instance.apiSRP.submitPesticideApplicationForm(data);
    if (res?.result == true) {
      Navigator.of(context).pop(true);
      DialogHelper.showToast(context,
          'SRP ${QuestionSectionType.pesticideApplication.title} Created Successfully');
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
              widget.listDatas[_index].date_action!),
          items: widget.listDatas
              .map((e) => DateHelper.convertDateToStr(e.date_action!))
              .toList(),
          onChanged: (v) {
            setState(() {
              _index = v;
              if (widget.listDatas[_index].is_finished == 1) {
                _getDataRemote();
              } else {
                _getData();
              }
            });
          },
        ),
      ),
      title: QuestionSectionType.pesticideApplication.title,
      questions: _questions,
      onAdd: (i) {
        if (_questions[i].key == 'pesticide_details') {
          final l = _questions.where((e) => e.section == 'pesticide_details');
          _questions.insertAll(i + 1, l);
        } else {
          final l =
              _questions[i].getSubQuestions(_questions[i].answer!.answer!);
          _questions.addAll(l);
        }

        setState(() {});
      },
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
      onChangeRadio: (r, i) {
        if (r == 'yes') {
          _questions.insertAll(i + 1, _questions[i].getSubQuestions(r));
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
      onChangedDate: (v, i) {
        _questions[i].answer =
            AnswerModel(answer: DateHelper.convertDateToStr(v));
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
        } else if (_questions[i].key == 'machine_rental_charge') {
          final seedCost =
              _getMachineTotalCost(v, _questions[i + 1].answer?.answer ?? '');
          _questions[i + 2].answer = AnswerModel(answer: seedCost.toString());
        } else if (_questions[i].key == 'machine_fuel_charge') {
          final seedCost =
              _getMachineTotalCost(_questions[i - 1].answer?.answer ?? '', v);
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
      hideSave: widget.listDatas[_index].is_finished == 1,
    );
  }

  double _getLabourCost(String q, String p) {
    final numQ = double.tryParse(q) ?? 0;
    final numP = double.tryParse(p) ?? 0;
    return numQ * numP;
  }

  double _getMachineTotalCost(String q, String p) {
    final numQ = double.tryParse(q) ?? 0;
    final numP = double.tryParse(p) ?? 0;
    return numQ + numP;
  }
}
