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

class NutrientManagementScreen extends StatefulWidget {
  const NutrientManagementScreen({
    super.key,
    required this.srp,
    required this.date,
  });
  final SRPActionModel srp;
  final DateTime date;
  @override
  State<NutrientManagementScreen> createState() =>
      _NutrientManagementScreenState();
}

class _NutrientManagementScreenState extends State<NutrientManagementScreen> {
  List<QuestionSrpModel> _questions = [];
  List<QuestionSrpModel> _questionsOriginal = [];
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
    final res = await ApiProvider.instance.apiSRP.getNutrientManagementForm(
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
    final res =
        await rootBundle.loadString('assets/data/nutrient_management.json');
    final data = List<Map<String, dynamic>>.from(jsonDecode(res));
    _questionsOriginal = data.map((e) => QuestionSrpModel.fromJson(e)).toList();
    _questions = _questionsOriginal;
    setState(() {});
  }

  _onSave() async {
    var map = <String, dynamic>{};
    for (var e in _questions) {
      if (e.answer != null) {
        map[e.key!] = e.answer?.toJson(
          title: e.questionTitle,
          type: e.type,
        );
      }
    }
    Map<String, dynamic> data = {
      "farmer_id": widget.srp.srp?.farmer_id,
      "cultivation_id": widget.srp.srp?.cultivation_id,
      "srp_id": widget.srp.srp_id,
      'data_question_answer_group': [map],
      'date_action': DateHelper.convertDateToStr(widget.date),
    };
    final res =
        await ApiProvider.instance.apiSRP.submitNutrientManagementForm(data);
    if (res?.result == true) {
      Navigator.of(context).pop(true);
      DialogHelper.showToast(context,
          'SRP ${QuestionSectionType.nutrientManagement.title} Created Successfully');
    }
  }

  @override
  Widget build(BuildContext context) {
    return SurveyView(
      title: QuestionSectionType.nutrientManagement.title,
      questions: _questions,
      onChangedDropdown: (r, i) {
        _questions.removeSubList(
            _questions[i].getSubQuestions(_questions[i].answer?.answer ?? ''));
        _questions.insertAll(i + 1, _questions[i].getSubQuestions(r));

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
      onSave: _onSave,
      hideSave: widget.srp.is_finished == 1,
    );
  }
}
