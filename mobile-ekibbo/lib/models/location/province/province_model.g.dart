// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'province_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ProvinceModel _$ProvinceModelFromJson(Map<String, dynamic> json) =>
    ProvinceModel()
      ..id = json['id'] as int?
      ..provinceName = json['province_name'] as String?
      ..provinceCode = json['province_code'] as String?
      ..countryId = json['country_id'] as int?;

Map<String, dynamic> _$ProvinceModelToJson(ProvinceModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'province_name': instance.provinceName,
      'province_code': instance.provinceCode,
      'country_id': instance.countryId,
    };
