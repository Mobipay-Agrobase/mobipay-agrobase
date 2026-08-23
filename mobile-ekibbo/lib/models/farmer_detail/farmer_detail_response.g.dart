// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'farmer_detail_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FarmerDetailResponse _$FarmerDetailResponseFromJson(
        Map<String, dynamic> json) =>
    FarmerDetailResponse()
      ..farmerData = json['farmer_data'] == null
          ? null
          : FarmerModel.fromJson(json['farmer_data'] as Map<String, dynamic>);

Map<String, dynamic> _$FarmerDetailResponseToJson(
        FarmerDetailResponse instance) =>
    <String, dynamic>{
      'farmer_data': instance.farmerData,
    };
