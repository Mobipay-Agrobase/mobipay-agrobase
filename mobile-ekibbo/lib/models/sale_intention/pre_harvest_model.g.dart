// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'pre_harvest_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MPreHarvestQC _$MPreHarvestQCFromJson(Map<String, dynamic> json) =>
    MPreHarvestQC(
      id: json['id'] as int? ?? 0,
      min_standard: json['min_standard'] as int? ?? 0,
      max_standard: json['max_standard'] as int? ?? 0,
      description: json['description'] as String? ?? '',
      unit: json['unit'] as String? ?? '',
      value: json['value'] as String? ?? '',
      type: json['type'] as int? ?? 0,
      descriptionEn: json['description_en'] as String? ?? '',
      descriptionVi: json['description_vn'] as String? ?? '',
    );

Map<String, dynamic> _$MPreHarvestQCToJson(MPreHarvestQC instance) =>
    <String, dynamic>{
      'id': instance.id,
      'min_standard': instance.min_standard,
      'max_standard': instance.max_standard,
      'description': instance.description,
      'unit': instance.unit,
      'value': instance.value,
      'type': instance.type,
      'description_vn': instance.descriptionVi,
      'description_en': instance.descriptionEn,
    };
