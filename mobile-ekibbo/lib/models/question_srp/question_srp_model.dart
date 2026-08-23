// ignore_for_file: non_constant_identifier_names

import 'package:json_annotation/json_annotation.dart';
part 'question_srp_model.g.dart';

@JsonSerializable()
class QuestionSrpModel {
  String? key;
  @JsonKey(name: 'question_title')
  String? questionTitle;
  String? type;
  List<OptionModel>? options;
  AnswerModel? answer;
  String? section;
  String? parent;
  @JsonKey(name: 'is_multiple')
  bool? isMultiple;
  bool? is_require;
  QuestionSrpModel({
    this.key,
    this.questionTitle,
    this.type,
    this.options,
    this.answer,
    this.section,
    this.parent,
    this.isMultiple,
    this.is_require,
  });
  factory QuestionSrpModel.fromJson(Map<String, dynamic> json) =>
      _$QuestionSrpModelFromJson(json);
  QuestionSrpModel copyWith() {
    return QuestionSrpModel(
      key: key,
      questionTitle: questionTitle,
      type: type,
      options: options,
      answer: null,
      section: section,
      parent: parent,
      is_require: is_require,
      isMultiple: isMultiple,
    );
  }

  int getScore(String answer) {
    if (options == null) {
      return 0;
    }
    final r = options!
        .where((e) => e.title?.toLowerCase() == answer.toLowerCase())
        .toList();
    if (r.isEmpty) {
      return 0;
    }
    return r.first.score ?? 0;
  }

  List<QuestionSrpModel> getSubQuestions(String answer, {bool ignore = false}) {
    if (options == null) {
      return [];
    }
    if (ignore) {
      if (options
              ?.firstWhere((e) => e.title == answer,
                  orElse: () => OptionModel())
              .isMultiple ==
          true) {
        isMultiple = true;
      }
    } else {
      isMultiple = null;
    }
    final r = options!
        .where((e) => e.title?.toLowerCase() == answer.toLowerCase())
        .toList();
    if (r.isEmpty) {
      return [];
    }
    List<QuestionSrpModel> ques = [];
    r.first.questions?.forEach((e) {
      ques.add(e.copyWith());
    });
    return ques;
  }
}

@JsonSerializable()
class AnswerModel {
  String? answer;
  int? score;
  AnswerModel({
    this.answer,
    this.score,
  });
  factory AnswerModel.fromJson(Map<String, dynamic> json) =>
      _$AnswerModelFromJson(json);
  Map<String, dynamic> toJson({
    String? section,
    String? title,
    String? type,
  }) {
    return {
      'answer': answer,
      'score': score ?? 0,
      'title': title,
      'type': type,
      if (section != null) 'section': section
    };
  }
}

@JsonSerializable()
class OptionModel {
  String? title;
  int? score;
  List<QuestionSrpModel>? questions;
  @JsonKey(name: 'is_multiple')
  bool? isMultiple;
  OptionModel({this.title, this.score, this.questions});
  factory OptionModel.fromJson(Map<String, dynamic> json) =>
      _$OptionModelFromJson(json);
}

enum QuestionType {
  date_picker,
  radio,
  dropdown,
  text_box,
  upload,
  auto_fill,
  multi_upload,
  multi_select,
  none,
  time_picker,
}

extension ExtListQuestion on List<QuestionSrpModel> {
  void removeSubList(List<QuestionSrpModel> subLists) {
    final m = {};

    for (final e in subLists) {
      m[e.key!] = 1;
    }
    removeWhere((e) => m[e.key] != null);
  }

  bool isValid() {
    for (final e in this) {
      if (e.is_require == true && e.answer == null) {
        return false;
      }
    }
    return true;
  }
}
