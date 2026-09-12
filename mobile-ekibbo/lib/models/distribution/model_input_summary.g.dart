// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'model_input_summary.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MInputSummary _$MInputSummaryFromJson(Map<String, dynamic> json) =>
    MInputSummary(
      dealers: json['dealers'] as int? ?? 0,
      productsTotal: json['products_total'] as int? ?? 0,
      productsInStock: json['products_in_stock'] as int? ?? 0,
      unitsInStock: (json['units_in_stock'] as num?)?.toDouble() ?? 0,
      pendingRequests: json['pending_requests'] as int? ?? 0,
      byCategory: (json['by_category'] as List<dynamic>? ?? [])
          .map((e) => MInputCategoryStock.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$MInputSummaryToJson(MInputSummary instance) =>
    <String, dynamic>{
      'dealers': instance.dealers,
      'products_total': instance.productsTotal,
      'products_in_stock': instance.productsInStock,
      'units_in_stock': instance.unitsInStock,
      'pending_requests': instance.pendingRequests,
      'by_category': instance.byCategory.map((e) => e.toMap()).toList(),
    };

MInputCategoryStock _$MInputCategoryStockFromJson(Map<String, dynamic> json) =>
    MInputCategoryStock(
      name: json['name'] as String? ?? '',
      products: json['products'] as int? ?? 0,
      units: (json['units'] as num?)?.toDouble() ?? 0,
    );

Map<String, dynamic> _$MInputCategoryStockToJson(MInputCategoryStock instance) =>
    <String, dynamic>{
      'name': instance.name,
      'products': instance.products,
      'units': instance.units,
    };
