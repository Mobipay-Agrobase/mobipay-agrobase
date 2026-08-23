// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'srp_result_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SRPResultModel _$SRPResultModelFromJson(Map<String, dynamic> json) =>
    SRPResultModel()
      ..question = json['question'] as String?
      ..answer = json['answer'] as String?
      ..score = json['score'] as int?
      ..title = json['title'] as String?
      ..type = json['type'] as String?;

Map<String, dynamic> _$SRPResultModelToJson(SRPResultModel instance) =>
    <String, dynamic>{
      'question': instance.question,
      'answer': instance.answer,
      'score': instance.score,
      'title': instance.title,
      'type': instance.type,
    };
