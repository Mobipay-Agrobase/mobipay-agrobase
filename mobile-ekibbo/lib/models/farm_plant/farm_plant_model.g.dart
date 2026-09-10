// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'farm_plant_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FarmPlantModel _$FarmPlantModelFromJson(Map<String, dynamic> json) =>
    FarmPlantModel()
      ..id = json['id'] as int?
      ..farmLandId = json['farm_land_id'] as int?
      ..cropCategory = json['crop_category'] as String?
      ..variety = json['variety'] as String?
      ..plantCount = json['plant_count'] as int?
      ..notes = json['notes'] as String?;

Map<String, dynamic> _$FarmPlantModelToJson(FarmPlantModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'farm_land_id': instance.farmLandId,
      'crop_category': instance.cropCategory,
      'variety': instance.variety,
      'plant_count': instance.plantCount,
      'notes': instance.notes,
    };
