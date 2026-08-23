// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dropdown_crop_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DropdownCropModel _$DropdownCropModelFromJson(Map<String, dynamic> json) =>
    DropdownCropModel()
      ..season = (json['season'] as List<dynamic>?)
          ?.map((e) => SeasonModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..cropInformation = (json['crop_information'] as List<dynamic>?)
          ?.map((e) => DropdownMasterModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..farmLand = (json['farm_land'] as List<dynamic>?)
          ?.map((e) => FarmLandModel.fromJson(e as Map<String, dynamic>))
          .toList();

Map<String, dynamic> _$DropdownCropModelToJson(DropdownCropModel instance) =>
    <String, dynamic>{
      'season': instance.season,
      'crop_information': instance.cropInformation,
      'farm_land': instance.farmLand,
    };
