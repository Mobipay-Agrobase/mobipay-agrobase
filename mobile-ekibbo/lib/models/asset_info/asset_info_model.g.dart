// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'asset_info_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AssetInfoModel _$AssetInfoModelFromJson(Map<String, dynamic> json) =>
    AssetInfoModel()
      ..id = json['id'] as int?
      ..farmerId = json['farmer_id'] as int?
      ..housingOwnership = json['housing_ownership'] as String?
      ..houseType = json['house_type'] as String?
      ..consumerElectronic = json['consumer_electronic'] as String?
      ..vehicle = json['vehicle'] as String?;

Map<String, dynamic> _$AssetInfoModelToJson(AssetInfoModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'farmer_id': instance.farmerId,
      'housing_ownership': instance.housingOwnership,
      'house_type': instance.houseType,
      'consumer_electronic': instance.consumerElectronic,
      'vehicle': instance.vehicle,
    };
