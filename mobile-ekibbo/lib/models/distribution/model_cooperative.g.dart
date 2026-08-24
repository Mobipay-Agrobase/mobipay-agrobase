// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'model_cooperative.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MCooperative _$MCooperativeFromJson(Map<String, dynamic> json) => MCooperative(
      id: json['id'] as int? ?? 0,
      staffId: json['staff_id'] as int? ?? 0,
      name: json['cooperative_name'] as String? ?? json['name'] as String? ?? '',
      cooperativeCode: json['cooperative_code'] as String? ?? '',
    );

Map<String, dynamic> _$MCooperativeToJson(MCooperative instance) =>
    <String, dynamic>{
      'id': instance.id,
      'staff_id': instance.staffId,
      'cooperative_name': instance.name,
      'cooperative_code': instance.cooperativeCode,
    };
