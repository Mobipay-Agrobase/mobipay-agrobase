// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'asset_info_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AssetInfoResponse _$AssetInfoResponseFromJson(Map<String, dynamic> json) =>
    AssetInfoResponse()
      ..dataHousingOwner = (json['data_housing_owner'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..dataHouseType = (json['data_house_type'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..dataConsumerElectronic = (json['data_consumer_electronic']
              as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..dataVehicle = (json['data_vehicle'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..assetInfo = json['asset_info'] == null
          ? null
          : AssetInfoModel.fromJson(json['asset_info'] as Map<String, dynamic>);

Map<String, dynamic> _$AssetInfoResponseToJson(AssetInfoResponse instance) =>
    <String, dynamic>{
      'data_housing_owner': instance.dataHousingOwner,
      'data_house_type': instance.dataHouseType,
      'data_consumer_electronic': instance.dataConsumerElectronic,
      'data_vehicle': instance.dataVehicle,
      'asset_info': instance.assetInfo,
    };
