// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dropdown_crop_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CropVarietyMasterModel _$CropVarietyMasterModelFromJson(
        Map<String, dynamic> json) =>
    CropVarietyMasterModel()
      ..id = json['id'] as int?
      ..name = json['name'] as String?
      ..cropId = json['crop_id'] as int?;

Map<String, dynamic> _$CropVarietyMasterModelToJson(
        CropVarietyMasterModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'crop_id': instance.cropId,
    };

DropdownCropModel _$DropdownCropModelFromJson(Map<String, dynamic> json) =>
    DropdownCropModel()
      ..season = (json['season'] as List<dynamic>?)
          ?.map((e) => SeasonModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..cropInformation = (json['crop_information'] as List<dynamic>?)
          ?.map((e) => DropdownMasterModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..cropVariety = (json['crop_variety'] as List<dynamic>?)
          ?.map((e) => CropVarietyMasterModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..farmLand = (json['farm_land'] as List<dynamic>?)
          ?.map((e) => FarmLandModel.fromJson(e as Map<String, dynamic>))
          .toList();

Map<String, dynamic> _$DropdownCropModelToJson(DropdownCropModel instance) =>
    <String, dynamic>{
      'season': instance.season,
      'crop_information': instance.cropInformation,
      'crop_variety': instance.cropVariety,
      'farm_land': instance.farmLand,
    };
