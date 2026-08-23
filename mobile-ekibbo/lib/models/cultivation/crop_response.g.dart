// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'crop_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CropResponse _$CropResponseFromJson(Map<String, dynamic> json) => CropResponse()
  ..cultivationData = json['cultivation_data'] == null
      ? null
      : CultivationModel.fromJson(
          json['cultivation_data'] as Map<String, dynamic>)
  ..seasonMaster = (json['season_master'] as List<dynamic>?)
      ?.map((e) => SeasonModel.fromJson(e as Map<String, dynamic>))
      .toList()
  ..cropMaster = (json['crop_master'] as List<dynamic>?)
      ?.map((e) => DropdownMasterModel.fromJson(e as Map<String, dynamic>))
      .toList()
  ..farmLand = (json['farm_land'] as List<dynamic>?)
      ?.map((e) => FarmLandModel.fromJson(e as Map<String, dynamic>))
      .toList()
  ..carbonEmissionId = json['carbon_emission_id'] as int?;

Map<String, dynamic> _$CropResponseToJson(CropResponse instance) =>
    <String, dynamic>{
      'cultivation_data': instance.cultivationData,
      'season_master': instance.seasonMaster,
      'crop_master': instance.cropMaster,
      'farm_land': instance.farmLand,
      'carbon_emission_id': instance.carbonEmissionId,
    };
