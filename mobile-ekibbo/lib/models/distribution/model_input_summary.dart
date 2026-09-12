// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:json_annotation/json_annotation.dart';

part 'model_input_summary.g.dart';

/// Second review (K — Input Summary): the same stock-ledger numbers the web
/// Input Aggregation summary shows, served by
/// GET /mobile/ekibbo-input-products?type=summary.
@JsonSerializable()
class MInputSummary {
  @JsonKey(defaultValue: 0)
  final int dealers;

  @JsonKey(name: 'products_total', defaultValue: 0)
  final int productsTotal;

  @JsonKey(name: 'products_in_stock', defaultValue: 0)
  final int productsInStock;

  @JsonKey(name: 'units_in_stock', defaultValue: 0)
  final double unitsInStock;

  @JsonKey(name: 'pending_requests', defaultValue: 0)
  final int pendingRequests;

  @JsonKey(name: 'by_category', defaultValue: [])
  final List<MInputCategoryStock> byCategory;

  MInputSummary({
    required this.dealers,
    required this.productsTotal,
    required this.productsInStock,
    required this.unitsInStock,
    required this.pendingRequests,
    required this.byCategory,
  });

  Map<String, dynamic> toMap() => _$MInputSummaryToJson(this);

  factory MInputSummary.fromJson(Map<String, dynamic> map) =>
      _$MInputSummaryFromJson(map);
}

@JsonSerializable()
class MInputCategoryStock {
  @JsonKey(defaultValue: '')
  final String name;

  @JsonKey(defaultValue: 0)
  final int products;

  @JsonKey(defaultValue: 0)
  final double units;

  MInputCategoryStock({
    required this.name,
    required this.products,
    required this.units,
  });

  Map<String, dynamic> toMap() => _$MInputCategoryStockToJson(this);

  factory MInputCategoryStock.fromJson(Map<String, dynamic> map) =>
      _$MInputCategoryStockFromJson(map);
}
