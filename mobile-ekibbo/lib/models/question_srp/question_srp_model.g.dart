// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'question_srp_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionSrpModel _$QuestionSrpModelFromJson(Map<String, dynamic> json) =>
    QuestionSrpModel(
      key: json['key'] as String?,
      questionTitle: json['question_title'] as String?,
      type: json['type'] as String?,
      options: (json['options'] as List<dynamic>?)
          ?.map((e) => OptionModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      answer: json['answer'] == null
          ? null
          : AnswerModel.fromJson(json['answer'] as Map<String, dynamic>),
      section: json['section'] as String?,
      parent: json['parent'] as String?,
      isMultiple: json['is_multiple'] as bool?,
      is_require: json['is_require'] as bool?,
    );

Map<String, dynamic> _$QuestionSrpModelToJson(QuestionSrpModel instance) =>
    <String, dynamic>{
      'key': instance.key,
      'question_title': instance.questionTitle,
      'type': instance.type,
      'options': instance.options,
      'answer': instance.answer,
      'section': instance.section,
      'parent': instance.parent,
      'is_multiple': instance.isMultiple,
      'is_require': instance.is_require,
    };

AnswerModel _$AnswerModelFromJson(Map<String, dynamic> json) => AnswerModel(
      answer: json['answer'] as String?,
      score: json['score'] as int?,
    );

Map<String, dynamic> _$AnswerModelToJson(AnswerModel instance) =>
    <String, dynamic>{
      'answer': instance.answer,
      'score': instance.score,
    };

OptionModel _$OptionModelFromJson(Map<String, dynamic> json) => OptionModel(
      title: json['title'] as String?,
      score: json['score'] as int?,
      questions: (json['questions'] as List<dynamic>?)
          ?.map((e) => QuestionSrpModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    )..isMultiple = json['is_multiple'] as bool?;

Map<String, dynamic> _$OptionModelToJson(OptionModel instance) =>
    <String, dynamic>{
      'title': instance.title,
      'score': instance.score,
      'questions': instance.questions,
      'is_multiple': instance.isMultiple,
    };
