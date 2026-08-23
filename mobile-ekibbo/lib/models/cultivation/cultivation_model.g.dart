// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'cultivation_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CultivationModel _$CultivationModelFromJson(Map<String, dynamic> json) =>
    CultivationModel()
      ..id = json['id'] as int?
      ..farmLandId = json['farm_land_id'] as int?
      ..cropVariety = json['crop_variety'] as String?
      ..sowingDate = json['sowing_date'] as String?
      ..expectDate = json['expect_date'] as String?
      ..estYield = json['est_yield'] as String?
      ..cropsMaster = json['crops_master'] == null
          ? null
          : DropdownMasterModel.fromJson(
              json['crops_master'] as Map<String, dynamic>)
      ..season = json['season'] == null
          ? null
          : SeasonModel.fromJson(json['season'] as Map<String, dynamic>)
      ..photo = json['photo'] as String?
      ..photoUrl = json['photo_url'] as String?
      ..cropName = json['crop_name'] as String?;

Map<String, dynamic> _$CultivationModelToJson(CultivationModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'farm_land_id': instance.farmLandId,
      'crop_variety': instance.cropVariety,
      'sowing_date': instance.sowingDate,
      'expect_date': instance.expectDate,
      'est_yield': instance.estYield,
      'crops_master': instance.cropsMaster,
      'season': instance.season,
      'photo': instance.photo,
      'photo_url': instance.photoUrl,
      'crop_name': instance.cropName,
    };

SeasonModel _$SeasonModelFromJson(Map<String, dynamic> json) => SeasonModel()
  ..id = json['id'] as int?
  ..seasonName = json['season_name'] as String?
  ..name = json['name'] as String?;

Map<String, dynamic> _$SeasonModelToJson(SeasonModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'season_name': instance.seasonName,
      'name': instance.name,
    };
