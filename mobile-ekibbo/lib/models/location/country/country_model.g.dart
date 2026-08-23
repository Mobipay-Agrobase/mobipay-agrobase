// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'country_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CountryModel _$CountryModelFromJson(Map<String, dynamic> json) => CountryModel()
  ..id = json['id'] as int?
  ..countryName = json['country_name'] as String?
  ..countryCode = json['country_code'] as String?;

Map<String, dynamic> _$CountryModelToJson(CountryModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'country_name': instance.countryName,
      'country_code': instance.countryCode,
    };
