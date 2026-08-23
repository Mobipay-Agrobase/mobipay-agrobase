// ignore_for_file: use_build_context_synchronously

import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/models/question_srp/question_srp_model.dart';
import 'package:agrobase_ekibbo/models/srp/srp_schedule_response.dart';
import 'package:agrobase_ekibbo/presentation/srp/models/question_section_model.dart';
import 'package:agrobase_ekibbo/presentation/srp/widgets/survey_view.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class LabourRightScreen extends StatefulWidget {
  const LabourRightScreen({
    super.key,
    required this.srp,
    required this.date,
  });
  final SRPActionModel srp;
  final DateTime date;
  @override
  State<LabourRightScreen> createState() => _LabourRightScreenState();
}

class _LabourRightScreenState extends State<LabourRightScreen> {
  List<QuestionSrpModel> _questions = [];
  @override
  void initState() {
    super.initState();
    if (widget.srp.is_finished == 1) {
      _getDataRemote();
    } else {
      _getData();
    }
  }

  _getDataRemote() async {
    final res = await ApiProvider.instance.apiSRP.getLabourRightForm(
        DateHelper.convertDateToStr(widget.srp.date_action!),
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
    final res = await rootBundle.loadString('assets/data/labour_rights.json');
    final data = List<Map<String, dynamic>>.from(jsonDecode(res));
    _questions = data.map((e) {
      final o = QuestionSrpModel.fromJson(e);
      if (o.type == QuestionType.date_picker.name) {
        o.answer =
            AnswerModel(answer: DateHelper.convertDateToStr(DateTime.now()));
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
      if (e.section == 'employment_of_children') {
        e.answer ??= AnswerModel();
        map2[e.key!] = e.answer?.toJson(
          section: e.section,
          title: e.questionTitle,
          type: e.type,
        );

        if (e.key == "id_proof") {
          arrMap.add(map2);
          map2 = {};
        }
      } else if (e.section == 'hazardous_work') {
        map1[e.key!] = e.answer?.toJson(
          section: e.section,
          title: e.questionTitle,
          type: e.type,
        );
        arrMap.add(map1);
        map1 = {};
      } else if (e.section == 'education') {
        map1[e.key!] = e.answer?.toJson(
          section: e.section,
          title: e.questionTitle,
          type: e.type,
        );

        if (e.key == 'any_efforts_are_made_to_provide_them_education') {
          arrMap.add(map1);
          map1 = {};
        } else if (e.answer?.answer == 'no') {
          arrMap.add(map1);
          map1 = {};
        }
      } else if (e.section == 'forced_labor') {
        map1[e.key!] = e.answer?.toJson(
          section: e.section,
          title: e.questionTitle,
          type: e.type,
        );
        if (e.key == 'select_the_following_criteria_are_met') {
          arrMap.add(map1);
          map1 = {};
        }
      } else if (e.section == 'discrimination') {
        map1[e.key!] = e.answer?.toJson(
          section: e.section,
          title: e.questionTitle,
          type: e.type,
        );
        if (e.key == 'select_the_following_criteria_are_met_discrimination') {
          arrMap.add(map1);
          map1 = {};
        }
      } else if (e.section == 'freedom_of_association') {
        map1[e.key!] = e.answer?.toJson(
          section: e.section,
          title: e.questionTitle,
          type: e.type,
        );
        if (e.key == 'select_the_following_criteria_are_met_freedom') {
          arrMap.add(map1);
          map1 = {};
        }
      } else if (e.section == 'wages') {
        map1[e.key!] = e.answer?.toJson(
          section: e.section,
          title: e.questionTitle,
          type: e.type,
        );
        if (e.key == 'select_the_following_criteria_are_met_wages') {
          arrMap.add(map1);
          map1 = {};
        }
      }
    }
    // if (map2.length > 1) {
    //   arrMap.add(map2);
    // }
    // arrMap.add(map1);

    Map<String, dynamic> data = {
      "farmer_id": widget.srp.srp?.farmer_id,
      "cultivation_id": widget.srp.srp?.cultivation_id,
      "srp_id": widget.srp.srp_id,
      'data_question_answer_group': arrMap,
      'date_action': DateHelper.convertDateToStr(widget.date),
    };
    debugPrint(arrMap.toString());

    final res = await ApiProvider.instance.apiSRP.submitLabourRightForm(data);
    if (res?.result == true) {
      Navigator.of(context).pop(true);
      DialogHelper.showToast(context,
          'SRP ${QuestionSectionType.labourRights.title} Created Successfully');
    }
  }

  @override
  Widget build(BuildContext context) {
    return SurveyView(
      title: QuestionSectionType.labourRights.title,
      questions: _questions,
      onChangeRadio: (r, i) {
        if (r == 'yes') {
          if (i == 0) {
            _questions[i].isMultiple = true;
          }
          _questions.insertAll(
              i + 1, _questions[i].getSubQuestions(r, ignore: true));
        } else {
          if (i == 0) {
            _questions[i].isMultiple = false;
          }
          _questions.removeSubList(_questions[i]
              .getSubQuestions(_questions[i].answer?.answer ?? ''));
        }
        _questions[i].answer = AnswerModel(
          answer: r,
          score: _questions[i].getScore(r),
        );

        setState(() {});
      },
      onAdd: (i) {
        final l = _questions.where((e) =>
            e.section == 'employment_of_children' &&
            e.key != 'there_children_below_the_age_of_15');
        _questions.insertAll(i + 1, l);

        setState(() {});
      },
      onChangedDropdown: (r, i) {
        if (i + 1 >= _questions.length) {
          _questions.addAll(_questions[i].getSubQuestions(r));
        } else {
          _questions.insertAll(i + 1, _questions[i].getSubQuestions(r));
        }

        // if (_questions[i].parent == null &&
        //     _questions[i].key == 'activity_done_by') {
        //   _questions.removeWhere((e) => e.parent != null && e.parent != r);
        // } else {
        //   _questions.removeSubList(_questions[i]
        //       .getSubQuestions(_questions[i].answer?.answer ?? ''));
        // }

        _questions[i].answer = AnswerModel(
          answer: r,
          score: _questions[i].getScore(r),
        );
        setState(() {});
      },
      onChangedFile: (f, i) {
        _questions[i].answer = AnswerModel(
          answer: f,
        );
        setState(() {});
      },
      onChangedTextField: (v, i) {
        _questions[i].answer = AnswerModel(answer: v);
        setState(() {});
      },
      onChangedDate: (v, i) {
        _questions[i].answer =
            AnswerModel(answer: DateHelper.convertDateToStr(v));
        final age = DateTime.now().year - v.year;
        _questions[i + 1].answer = AnswerModel(answer: age.toString());
        setState(() {});
      },
      onSave: _onSave,
      hideSave: widget.srp.is_finished == 1,
    );
  }
}
