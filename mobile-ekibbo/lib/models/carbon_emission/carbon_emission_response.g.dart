// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'carbon_emission_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CarbonEmissionResponse _$CarbonEmissionResponseFromJson(
        Map<String, dynamic> json) =>
    CarbonEmissionResponse()
      ..dataEmission = json['data_emission'] == null
          ? null
          : EmissionDataModel.fromJson(
              json['data_emission'] as Map<String, dynamic>)
      ..dataProductLoss = json['data_product_loss'] == null
          ? null
          : ProductDataLossModel.fromJson(
              json['data_product_loss'] as Map<String, dynamic>);

Map<String, dynamic> _$CarbonEmissionResponseToJson(
        CarbonEmissionResponse instance) =>
    <String, dynamic>{
      'data_emission': instance.dataEmission,
      'data_product_loss': instance.dataProductLoss,
    };
