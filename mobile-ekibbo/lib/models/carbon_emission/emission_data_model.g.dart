// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'emission_data_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

EmissionDataModel _$EmissionDataModelFromJson(Map<String, dynamic> json) =>
    EmissionDataModel()
      ..id = json['id'] as int?
      ..carbonEmissionsId = json['carbon_emissions_id'] as int?
      ..cultivation = (json['cultivation'] as num?)?.toDouble()
      ..hgh = (json['hgh'] as num?)?.toDouble()
      ..cropEstablish = (json['crop_establish'] as num?)?.toDouble()
      ..waterSoil = (json['water_soil'] as num?)?.toDouble()
      ..fetilizer = (json['fetilizer'] as num?)?.toDouble()
      ..equipment = json['equipment'] as int?
      ..harvesting = json['harvesting'] as int?
      ..strawManagement = json['straw_management'] as int?
      ..drying = json['drying'] as int?
      ..storing = (json['storing'] as num?)?.toDouble()
      ..milling = (json['milling'] as num?)?.toDouble()
      ..packaging = (json['packaging'] as num?)?.toDouble()
      ..transports = (json['transports'] as num?)?.toDouble()
      ..co2Emission = (json['co2_emission'] as num?)?.toDouble()
      ..ch4Emission = (json['ch4_emission'] as num?)?.toDouble()
      ..n20Emission = (json['n20_emission'] as num?)?.toDouble()
      ..ghgEmission = (json['ghg_emission'] as num?)?.toDouble()
      ..carbonFootPrint = (json['carbon_foot_print'] as num?)?.toDouble()
      ..createdAt = json['createdAt'] as String?
      ..updatedAt = json['updatedAt'] as String?;

Map<String, dynamic> _$EmissionDataModelToJson(EmissionDataModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'carbon_emissions_id': instance.carbonEmissionsId,
      'cultivation': instance.cultivation,
      'hgh': instance.hgh,
      'crop_establish': instance.cropEstablish,
      'water_soil': instance.waterSoil,
      'fetilizer': instance.fetilizer,
      'equipment': instance.equipment,
      'harvesting': instance.harvesting,
      'straw_management': instance.strawManagement,
      'drying': instance.drying,
      'storing': instance.storing,
      'milling': instance.milling,
      'packaging': instance.packaging,
      'transports': instance.transports,
      'co2_emission': instance.co2Emission,
      'ch4_emission': instance.ch4Emission,
      'n20_emission': instance.n20Emission,
      'ghg_emission': instance.ghgEmission,
      'carbon_foot_print': instance.carbonFootPrint,
      'createdAt': instance.createdAt,
      'updatedAt': instance.updatedAt,
    };
