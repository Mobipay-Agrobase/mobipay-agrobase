// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'all_farm_land_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AllFarmLandResponse _$AllFarmLandResponseFromJson(Map<String, dynamic> json) =>
    AllFarmLandResponse()
      ..farmLandData = (json['farm_land_data'] as List<dynamic>?)
          ?.map((e) => FarmLandModel.fromJson(e as Map<String, dynamic>))
          .toList();

Map<String, dynamic> _$AllFarmLandResponseToJson(
        AllFarmLandResponse instance) =>
    <String, dynamic>{
      'farm_land_data': instance.farmLandData,
    };
