// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'model_attribute.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MAttribute _$MAttributeFromJson(Map<String, dynamic> json) => MAttribute(
      id: json['id'] as int? ?? 0,
      variant: json['variant'] as String? ?? '',
      sku: json['sku'] as String? ?? '',
      pricePerUnit: (json['price_per_unit'] as num?)?.toDouble() ?? 0,
      availableStocks: json['available_stocks'] as int? ?? 0,
    );

Map<String, dynamic> _$MAttributeToJson(MAttribute instance) =>
    <String, dynamic>{
      'id': instance.id,
      'variant': instance.variant,
      'sku': instance.sku,
      'price_per_unit': instance.pricePerUnit,
      'available_stocks': instance.availableStocks,
    };
