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
      ..listLatLng = json['listLatLng'] as String
      ..landSurveyNo = json['land_survey_no'] as String?
      ..waterSource = json['water_source'] as String?
      ..powerSource = json['power_source'] as String?
      ..soilFertility = json['soil_fertility'] as String?
      ..irrigationType = json['irrigation_type'] as String?
      ..estYield = json['est_yield'] as String?
      ..fullTimeWorkers = json['full_time_workers'] as String?
      ..partTimeWorkers = json['part_time_workers'] as String?
      ..seasonalWorkers = json['seasonal_workers'] as String?
      ..familyWorkers = json['family_workers'] as String?;

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
      'land_survey_no': instance.landSurveyNo,
      'water_source': instance.waterSource,
      'power_source': instance.powerSource,
      'soil_fertility': instance.soilFertility,
      'irrigation_type': instance.irrigationType,
      'est_yield': instance.estYield,
      'full_time_workers': instance.fullTimeWorkers,
      'part_time_workers': instance.partTimeWorkers,
      'seasonal_workers': instance.seasonalWorkers,
      'family_workers': instance.familyWorkers,
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
