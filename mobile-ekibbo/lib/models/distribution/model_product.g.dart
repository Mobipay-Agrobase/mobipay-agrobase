// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'model_product.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MProduct _$MProductFromJson(Map<String, dynamic> json) => MProduct(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      category_id: json['category_id'] as int? ?? 0,
      category_name: json['category_name'] as String? ?? '',
      tags: json['tags'] as String? ?? '',
      quantity: json['quantity'] as int? ?? 0,
      unit_price: (json['unit_price'] as num?)?.toDouble() ?? 0,
      available_stocks: json['available_stocks'] as int? ?? 0,
      m_qty: json['m_qty'] as int? ?? 0,
      unit: json['unit'] as String? ?? '',
      stocks: (json['stocks'] as List<dynamic>?)
              ?.map((e) => MAttribute.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );

Map<String, dynamic> _$MProductToJson(MProduct instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'category_id': instance.category_id,
      'category_name': instance.category_name,
      'tags': instance.tags,
      'quantity': instance.quantity,
      'unit_price': instance.unit_price,
      'available_stocks': instance.available_stocks,
      'm_qty': instance.m_qty,
      'unit': instance.unit,
      'stocks': instance.stocks,
    };
