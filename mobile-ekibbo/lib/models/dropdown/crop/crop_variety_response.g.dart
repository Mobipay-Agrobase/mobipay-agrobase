// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'crop_variety_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CropVarietyResponse _$CropVarietyResponseFromJson(Map<String, dynamic> json) =>
    CropVarietyResponse()
      ..cropVariety = (json['crop_variety'] as List<dynamic>?)
          ?.map((e) => DropdownMasterModel.fromJson(e as Map<String, dynamic>))
          .toList();

Map<String, dynamic> _$CropVarietyResponseToJson(
        CropVarietyResponse instance) =>
    <String, dynamic>{
      'crop_variety': instance.cropVariety,
    };
