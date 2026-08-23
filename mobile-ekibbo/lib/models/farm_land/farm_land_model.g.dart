// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'farm_land_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FarmLandModel _$FarmLandModelFromJson(Map<String, dynamic> json) =>
    FarmLandModel()
      ..id = json['id'] as int?
      ..farmName = json['farm_name'] as String?
      ..farmerId = json['farmer_id'] as int?
      ..totalLandHolding = (json['total_land_holding'] as num?)?.toDouble()
      ..totalCultivation = json['total_cultivation'] as int?
      ..cultivation = (json['cultivation'] as List<dynamic>?)
          ?.map((e) => CultivationModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..actualArea = json['actual_area'] as String?
      ..landOwnership = json['land_ownership'] as String?
      ..approachRoad = json['approach_road'] as String?
      ..landTopology = json['land_topology'] as String?
      ..landGradient = json['land_gradient'] as String?
      ..farmPhoto = json['farm_photo'] as String?
      ..landDocument = json['land_document'] as String?
      ..lat = json['lat'] as String?
      ..lng = json['lng'] as String?
      ..farmPlottings = (json['farmPlottings'] as List<dynamic>?)
          ?.map((e) => FarmPlottingModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..farmerDetails = json['farmer_details'] == null
          ? null
          : FarmerModel.fromJson(json['farmer_details'] as Map<String, dynamic>)
      ..tag = json['tag'] as String
      ..listLatLng = json['listLatLng'] as String;

Map<String, dynamic> _$FarmLandModelToJson(FarmLandModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'farm_name': instance.farmName,
      'farmer_id': instance.farmerId,
      'total_land_holding': instance.totalLandHolding,
      'total_cultivation': instance.totalCultivation,
      'cultivation': instance.cultivation,
      'actual_area': instance.actualArea,
      'land_ownership': instance.landOwnership,
      'approach_road': instance.approachRoad,
      'land_topology': instance.landTopology,
      'land_gradient': instance.landGradient,
      'farm_photo': instance.farmPhoto,
      'land_document': instance.landDocument,
      'lat': instance.lat,
      'lng': instance.lng,
      'farmPlottings': instance.farmPlottings,
      'farmer_details': instance.farmerDetails,
      'tag': instance.tag,
      'listLatLng': instance.listLatLng,
    };

FarmPlottingModel _$FarmPlottingModelFromJson(Map<String, dynamic> json) =>
    FarmPlottingModel()
      ..id = json['id'] as int?
      ..oderId = json['oderId'] as int?
      ..lat = json['lat'] as String?
      ..lng = json['lng'] as String?;

Map<String, dynamic> _$FarmPlottingModelToJson(FarmPlottingModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'oderId': instance.oderId,
      'lat': instance.lat,
      'lng': instance.lng,
    };
