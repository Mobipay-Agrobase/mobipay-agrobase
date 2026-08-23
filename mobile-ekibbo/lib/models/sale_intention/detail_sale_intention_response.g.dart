// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'detail_sale_intention_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DetailSaleIntentionResponse _$DetailSaleIntentionResponseFromJson(
        Map<String, dynamic> json) =>
    DetailSaleIntentionResponse()
      ..dataSaleIntention = json['data_sale_intention'] == null
          ? null
          : SaleIntentionModel.fromJson(
              json['data_sale_intention'] as Map<String, dynamic>);

Map<String, dynamic> _$DetailSaleIntentionResponseToJson(
        DetailSaleIntentionResponse instance) =>
    <String, dynamic>{
      'data_sale_intention': instance.dataSaleIntention,
    };
