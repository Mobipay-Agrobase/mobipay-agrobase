// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'farmland_detail_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FarmlandDetailResponse _$FarmlandDetailResponseFromJson(
        Map<String, dynamic> json) =>
    FarmlandDetailResponse()
      ..farmLandData = json['farm_land_data'] == null
          ? null
          : FarmLandModel.fromJson(
              json['farm_land_data'] as Map<String, dynamic>)
      ..farmLandPloting = (json['farm_land_ploting'] as List<dynamic>?)
          ?.map((e) => FarmPlottingModel.fromJson(e as Map<String, dynamic>))
          .toList();

Map<String, dynamic> _$FarmlandDetailResponseToJson(
        FarmlandDetailResponse instance) =>
    <String, dynamic>{
      'farm_land_data': instance.farmLandData,
      'farm_land_ploting': instance.farmLandPloting,
    };
