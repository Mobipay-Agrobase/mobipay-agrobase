// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'district_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DistrictModel _$DistrictModelFromJson(Map<String, dynamic> json) =>
    DistrictModel()
      ..id = json['id'] as int?
      ..districtName = json['district_name'] as String?
      ..districtCode = json['district_code'] as String?
      ..provinceId = json['province_id'] as int?;

Map<String, dynamic> _$DistrictModelToJson(DistrictModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'district_name': instance.districtName,
      'district_code': instance.districtCode,
      'province_id': instance.provinceId,
    };
