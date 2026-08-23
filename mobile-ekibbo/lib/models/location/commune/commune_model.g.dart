// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'commune_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CommuneModel _$CommuneModelFromJson(Map<String, dynamic> json) => CommuneModel()
  ..id = json['id'] as int?
  ..communeName = json['commune_name'] as String?
  ..communeCode = json['commune_code'] as String?
  ..districtId = json['district_id'] as int?;

Map<String, dynamic> _$CommuneModelToJson(CommuneModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'commune_name': instance.communeName,
      'commune_code': instance.communeCode,
      'district_id': instance.districtId,
    };
