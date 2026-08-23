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

class TrainingSurvenScreen extends StatefulWidget {
  const TrainingSurvenScreen({
    super.key,
    required this.srp,
    required this.date,
  });
  final SRPActionModel srp;
  final DateTime date;
  @override
  State<TrainingSurvenScreen> createState() => _TrainingSurvenScreenState();
}

class _TrainingSurvenScreenState extends State<TrainingSurvenScreen> {
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
    // _getData();
  }

  _getDataRemote() async {
    final res = await ApiProvider.instance.apiSRP.getTrainingForm(
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
    final res = await rootBundle.loadString('assets/data/training.json');
    final data = List<Map<String, dynamic>>.from(jsonDecode(res));
    _questionsOriginal = data.map((e) {
      final o = QuestionSrpModel.fromJson(e);
      if (o.type == QuestionType.date_picker.name) {
        o.answer =
            AnswerModel(answer: DateHelper.convertDateToStr(DateTime.now()));
      }
      return o;
    }).toList();
    _questions = [_questionsOriginal.first];
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
    debugPrint(data.toString());
    final res = await ApiProvider.instance.apiSRP.submitTrainingForm(data);
    if (res?.result == true) {
      Navigator.of(context).pop(true);
      DialogHelper.showToast(context, 'SRP Training Created Successfully');
    }
  }

  @override
  Widget build(BuildContext context) {
    return SurveyView(
      title: QuestionSectionType.training.title,
      questions: _questions,
      onChangeRadio: (r, i) {
        setState(
          () {
            if (i == 0) {
              if (r == 'yes') {
                _questions = _questionsOriginal;
              } else {
                _questions = [_questionsOriginal.first];
              }
            }

            _questions[i].answer = AnswerModel(
              answer: r,
              score: _questions[i].getScore(r),
            );
          },
        );
      },
      onChangedDate: (v, i) {
        _questions[i].answer =
            AnswerModel(answer: DateHelper.convertDateToStr(v));
        setState(() {});
      },
      onChangedDropdown: (v, i) {
        _questions[i].answer = AnswerModel(
          answer: v,
          score: _questions[i].getScore(v),
        );
        setState(() {});
      },
      onChangedTextField: (v, i) {
        _questions[i].answer = AnswerModel(answer: v);
        setState(() {});
      },
      onSave: _onSave,
      hideSave: widget.srp.is_finished == 1,
    );
  }
}
