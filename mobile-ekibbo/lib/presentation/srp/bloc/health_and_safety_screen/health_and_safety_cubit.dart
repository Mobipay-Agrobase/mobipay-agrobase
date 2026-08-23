import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/srp_client/srp_api_client.dart';
import 'package:agrobase_ekibbo/models/question_srp/question_srp_model.dart';
import 'package:agrobase_ekibbo/models/srp/srp_schedule_response.dart';

class HealthAndSafetyCubit extends Cubit<List<QuestionSrpModel>> {
  HealthAndSafetyCubit(this.srpApiClient) : super([]);

  final SRPApiClient srpApiClient;

  Future<void> getLocalQuestions() async {
    final res =
        await rootBundle.loadString('assets/data/health_and_safety.json');
    final data = List<Map<String, dynamic>>.from(jsonDecode(res));

    final questions = data.map<QuestionSrpModel>((e) {
      final o = QuestionSrpModel.fromJson(e);
      if (o.key == 'date_of_event') {
        o.answer =
            AnswerModel(answer: DateHelper.convertDateToStr(DateTime.now()));
      }
      return o;
    }).toList();
    emit(questions);
  }

  Future<void> getRemoteQuestions(DateTime date, int srpId) async {
    final res = await srpApiClient.getHealthAndSafetyForm(
      DateHelper.convertDateToStr(date),
      srpId,
    );
    if (res?.data != null) {
      final questions = <QuestionSrpModel>[];
      for (final e in res!.data!) {
        questions.add(
          QuestionSrpModel(
            key: e.question,
            questionTitle: e.title,
            type: e.type,
            answer: AnswerModel(answer: e.answer, score: e.score),
          ),
        );
      }
      emit(questions);
    }
  }

  void onDropdownChanged(String answer, int index) {
    final newState = state.toList();
    if (index + 1 >= state.length) {
      newState.addAll(newState[index].getSubQuestions(answer));
    } else {
      newState.insertAll(index + 1, newState[index].getSubQuestions(answer));
    }

    newState.removeSubList(
      newState[index].getSubQuestions(newState[index].answer?.answer ?? ''),
    );

    newState[index].answer = AnswerModel(
      answer: answer,
      score: newState[index].getScore(answer),
    );
    emit(newState);
  }

  void onChangedRadio(String answer, int index) {
    final newState = state.toList();
    if (index + 1 >= state.length) {
      newState.addAll(newState[index].getSubQuestions(answer));
    } else {
      newState.insertAll(index + 1, newState[index].getSubQuestions(answer));
    }
    newState.removeSubList(
      newState[index].getSubQuestions(newState[index].answer?.answer ?? ''),
    );

    newState[index].answer = AnswerModel(
      answer: answer,
      score: newState[index].getScore(answer),
    );
    emit(newState);
  }

  Future<void> submitForm(SRPActionModel srp, DateTime date) async {
    final data = <Map<String, dynamic>>[];
    for (final question in state) {
      if ((question.is_require ?? false) &&
          (question.answer?.answer ?? '').isEmpty) {
        throw Exception('Field: ${question.questionTitle} is required');
      }
      if (question.key == 'date_of_event') {
        continue;
      }
      final json = question.answer?.toJson(
        title: question.questionTitle,
        type: question.type,
        section: question.section,
      );
      if (json != null) {
        data.add(json);
      }
    }

    Map<String, dynamic> body = {
      "farmer_id": srp.srp?.farmer_id,
      "cultivation_id": srp.srp?.cultivation_id,
      "srp_id": srp.srp_id,
      'data_question_answer_group': data,
      'date_action': DateHelper.convertDateToStr(date),
    };
    final res = await srpApiClient.submitHealthAndSafetyForm(body);
    if (res?.result == false) {
      throw res?.message ?? res?.status ?? res?.statusCode;
    }
  }
}
