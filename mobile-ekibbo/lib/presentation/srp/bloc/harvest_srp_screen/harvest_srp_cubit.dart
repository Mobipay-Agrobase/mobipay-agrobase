import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/srp_client/srp_api_client.dart';
import 'package:agrobase_ekibbo/models/question_srp/question_srp_model.dart';
import 'package:agrobase_ekibbo/models/srp/srp_schedule_response.dart';

class HarvestSrpCubit extends Cubit<List<QuestionSrpModel>> {
  HarvestSrpCubit(this.srpApiClient) : super([]);

  final SRPApiClient srpApiClient;

  Future<void> getLocalQuestions() async {
    final res = await rootBundle.loadString('assets/data/harvest_srp.json');
    final data = List<Map<String, dynamic>>.from(jsonDecode(res));

    final questions = data.map<QuestionSrpModel>((e) {
      final o = QuestionSrpModel.fromJson(e);
      if (o.type == QuestionType.date_picker.name || o.key == 'date_of_event') {
        o.answer =
            AnswerModel(answer: DateHelper.convertDateToStr(DateTime.now()));
      }
      return o;
    }).toList();
    emit(questions);
  }

  Future<void> getRemoteQuestions(DateTime date, int srpId) async {
    final res = await srpApiClient.getHarvestForm(
      DateHelper.convertDateToStr(date),
      srpId,
    );
    if (res?.data != null) {
      final questions = <QuestionSrpModel>[];
      for (var e in res!.data!) {
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

  void onAddAnswer(int index) {
    final l = state[index].getSubQuestions(state[index].answer!.answer!);
    final newState = state.toList();
    newState.addAll(l);
    emit(newState);
  }

  void onDropdownChanged(String answer, int index) {
    final newState = state.toList();
    if (index + 1 >= state.length) {
      newState.addAll(newState[index].getSubQuestions(answer));
    } else {
      newState.insertAll(index + 1, newState[index].getSubQuestions(answer));
    }

    if (newState[index].parent == null &&
        newState[index].key == 'activity_done_by') {
      newState.removeWhere((e) => e.parent != null && e.parent != answer);
    } else {
      newState.removeSubList(newState[index]
          .getSubQuestions(newState[index].answer?.answer ?? ''));
    }

    newState[index].answer = AnswerModel(
      answer: answer,
      score: newState[index].getScore(answer),
    );
    emit(newState);
  }

  void onChangedDateTime(DateTime date, int index) {
    final newState = state.toList();
    newState[index].answer =
        AnswerModel(answer: DateHelper.convertDateToStr(date));
    emit(newState);
  }

  void onChangedRadio(String answer, int index) {
    final newState = state.toList();
    if (answer == 'yes') {
      newState.insertAll(index + 1, newState[index].getSubQuestions(answer));
    } else {
      newState.removeSubList(newState[index]
          .getSubQuestions(newState[index].answer?.answer ?? ''));
    }
    newState[index].answer = AnswerModel(
      answer: answer,
      score: newState[index].getScore(answer),
    );
    emit(newState);
  }

  void onChangedFile(String path, int index) {
    final newState = state.toList();
    newState[index].answer = AnswerModel(answer: path);
    emit(newState);
  }

  void onChangedTextField(String value, int index) {
    final newState = state.toList();
    newState[index].answer = AnswerModel(answer: value);
    final quantities = int.tryParse(value) ?? 0;
    switch (newState[index].key) {
      case 'harvest_labor_man_days':
        _calculateHarvestingCostByLaborDays(
          questions: newState,
          quantities: quantities,
          unitKey: 'harvest_labor_wages_per_area',
          resultKey: 'harvest_labor_total_cost',
        );
        break;
      case 'harvest_labor_wages_per_area':
        _calculateHarvestingCostByLaborDays(
          questions: newState,
          quantities: quantities,
          unitKey: 'harvest_labor_man_days',
          resultKey: 'harvest_labor_total_cost',
        );
        break;
      case 'harvest_number_of_machine':
        _calculateHarvestingCostByLaborDays(
          questions: newState,
          quantities: quantities,
          unitKey: 'harvest_machine_wages_per_area',
          resultKey: 'harvest_machine_total_cost',
        );
        break;
      case 'harvest_machine_wages_per_area':
        _calculateHarvestingCostByLaborDays(
          questions: newState,
          quantities: quantities,
          unitKey: 'harvest_number_of_machine',
          resultKey: 'harvest_machine_total_cost',
        );
        break;
      case 'drying_labor_man_days':
        _calculateHarvestingCostByLaborDays(
          questions: newState,
          quantities: quantities,
          unitKey: 'drying_labor_wages_per_quantity',
          resultKey: 'drying_labor_total_cost',
        );
        break;
      case 'drying_labor_wages_per_quantity':
        _calculateHarvestingCostByLaborDays(
          questions: newState,
          quantities: quantities,
          unitKey: 'drying_labor_man_days',
          resultKey: 'drying_labor_total_cost',
        );
        break;
      case 'storage_labor_man_days':
        _calculateHarvestingCostByLaborDays(
          questions: newState,
          quantities: quantities,
          unitKey: 'storage_labor_wages_per_quantity',
          resultKey: 'storage_labor_total_cost',
        );
        break;
      case 'storage_labor_wages_per_quantity':
        _calculateHarvestingCostByLaborDays(
          questions: newState,
          quantities: quantities,
          unitKey: 'storage_labor_man_days',
          resultKey: 'storage_labor_total_cost',
        );
        break;
    }
    emit(newState);
  }

  Future<void> submitHarvestForm(SRPActionModel srp, DateTime date) async {
    final data = <Map<String, dynamic>>[];
    final generalInformation = <String, dynamic>{};
    final harvestTime = <String, dynamic>{};
    final harvestCost = <String, dynamic>{};
    final dryingTime = <String, dynamic>{};
    final dryingCost = <String, dynamic>{};
    final dryingTechnique = <String, dynamic>{};
    final riceStorage = <String, dynamic>{};
    final riceStorageCost = <String, dynamic>{};
    final riceStubble = <String, dynamic>{};
    final riceStraw = <String, dynamic>{};

    for (final question in state) {
      if ((question.is_require ?? false) &&
          (question.answer?.answer ?? '').isEmpty) {
        throw Exception('Field: ${question.questionTitle} is required');
      }

      switch (question.section) {
        /// General information
        case 'general_information':
          if (question.key! == 'photo_captured' &&
              (question.answer?.answer != null)) {
            generalInformation[question.key!] = question.answer?.toJson(
              title: question.questionTitle,
              type: question.type,
              section: question.section,
            );
          }
          break;

        /// Time of harvest
        case 'time_of_harvest':
          harvestTime[question.key!] = question.answer?.toJson(
            title: question.questionTitle,
            type: question.type,
            section: question.section,
          );
          break;

        /// Total harvesting Cost
        case 'total_labor_cost_harvesting':
          harvestCost[question.key!] = question.answer?.toJson(
            section: question.section,
            title: question.questionTitle,
            type: question.type,
          );
          break;

        /// Drying time
        case 'drying_time':
          dryingTime[question.key!] = question.answer?.toJson(
            section: question.section,
            title: question.questionTitle,
            type: question.type,
          );
          break;

        /// Total drying Cost
        case 'total_labor_cost_drying':
          dryingCost[question.key!] = question.answer?.toJson(
            section: question.section,
            title: question.questionTitle,
            type: question.type,
          );
          break;

        /// Drying time
        case 'drying_technique':
          dryingTechnique[question.key!] = question.answer?.toJson(
            section: question.section,
            title: question.questionTitle,
            type: question.type,
          );
          break;

        /// Rice storage
        case 'rice_storage':
          riceStorage[question.key!] = question.answer?.toJson(
            section: question.section,
            title: question.questionTitle,
            type: question.type,
          );
          break;

        /// Total storing Cost
        case 'total_labor_cost_rice_storage':
          if (question.key == 'storage_activity_done_by') {
            riceStorageCost[question.key!] = question.answer?.toJson(
              section: question.section,
              title: question.questionTitle,
              type: question.type,
            );
          }
          if (question.key?.contains('labor') ?? false) {
            riceStorageCost[question.key!] = question.answer?.toJson(
              section: question.section,
              title: question.questionTitle,
              type: question.type,
            );
          }
          break;

        /// Rice stubble
        case 'rice_stubble':
          riceStubble[question.key!] = question.answer?.toJson(
            section: question.section,
            title: question.questionTitle,
            type: question.type,
          );
          break;

        /// Rice straw
        case 'rice_straw':
          riceStraw[question.key!] = question.answer?.toJson(
            section: question.section,
            title: question.questionTitle,
            type: question.type,
          );
          break;
      }
    }

    data.add(generalInformation);
    data.add(harvestTime);
    data.add(harvestCost);
    data.add(dryingTime);
    data.add(dryingCost);
    data.add(dryingTechnique);
    data.add(riceStorage);
    data.add(riceStorageCost);
    data.add(riceStubble);
    data.add(riceStraw);

    final body = <String, dynamic>{
      "farmer_id": srp.srp?.farmer_id,
      "cultivation_id": srp.srp?.cultivation_id,
      "srp_id": srp.srp_id,
      'data_question_answer_group': data,
      'date_action': DateHelper.convertDateToStr(date),
    };
    final res = await srpApiClient.submitHarvestForm(body);
    if (res?.result == false) {
      throw res?.message ?? res?.status ?? res?.statusCode;
    }
  }

  void _calculateHarvestingCostByLaborDays({
    required List<QuestionSrpModel> questions,
    required int quantities,
    required String unitKey,
    required String resultKey,
  }) {
    final units = int.tryParse(questions
                .firstWhere((element) => element.key == unitKey)
                .answer
                ?.answer ??
            '') ??
        0;
    for (int i = 0; i < questions.length; i++) {
      if (questions[i].key == resultKey) {
        questions[i].answer = AnswerModel(answer: '${quantities * units}');
        break;
      }
    }
  }
}
