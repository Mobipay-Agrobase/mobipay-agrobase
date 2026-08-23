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

class PrePlantingScreen extends StatefulWidget {
  const PrePlantingScreen({
    super.key,
    required this.srp,
    required this.date,
  });
  final SRPActionModel srp;
  final DateTime date;
  @override
  State<PrePlantingScreen> createState() => _PrePlantingScreenState();
}

class _PrePlantingScreenState extends State<PrePlantingScreen> {
  List<QuestionSrpModel> _questions = [];
  // List<QuestionSrpModel> _questionsOriginal = [];
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
    final res = await ApiProvider.instance.apiSRP.getPrePlantingForm(
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
    final res = await rootBundle.loadString('assets/data/pre_planting.json');
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
    final res = await ApiProvider.instance.apiSRP.submitPrePlantingForm(data);
    if (res?.result == true) {
      Navigator.of(context).pop();
      DialogHelper.showToast(context,
          'SRP ${QuestionSectionType.prePlating.title} Created Successfully');
    }
  }

  @override
  Widget build(BuildContext context) {
    return SurveyView(
      title: QuestionSectionType.prePlating.title,
      questions: _questions,
      onChangedDate: (v, i) {
        _questions[i].answer =
            AnswerModel(answer: DateHelper.convertDateToStr(v));
        setState(() {});
      },
      onChangedTextField: (v, i) {
        _questions[i].answer = AnswerModel(answer: v);
        if (_questions[i].key == 'quantity_of_used_seed') {
          final seedCost =
              _getSeedCost(v, _questions[i + 1].answer?.answer ?? '');
          _questions[i + 2].answer = AnswerModel(answer: seedCost.toString());
        } else if (_questions[i].key == 'price_of_seed') {
          final seedCost =
              _getSeedCost(_questions[i - 1].answer?.answer ?? '', v);
          _questions[i + 1].answer = AnswerModel(answer: seedCost.toString());
        } else if (_questions[i].key == 'sowing_charges') {
          // [plot area * sowing charges]
          final s = (double.tryParse(v) ?? 0) * 20;
          _questions[i + 1].answer = AnswerModel(answer: s.toString());
        }
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
      onSave: _onSave,
      onChangedFile: (f, i) {
        _questions[i].answer = AnswerModel(
          answer: f,
        );
        setState(() {});
      },
    );
  }

  double _getSeedCost(String q, String p) {
    final numQ = double.tryParse(q) ?? 0;
    final numP = double.tryParse(p) ?? 0;
    return numQ * numP;
  }
}
