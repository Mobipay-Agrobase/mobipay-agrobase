// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:json_annotation/json_annotation.dart';

import 'package:agrobase_ekibbo/models/distribution/model_attribute.dart';

part 'model_product.g.dart';

@JsonSerializable()
class MProduct {
  @JsonKey(defaultValue: 0)
  final int id;

  @JsonKey(defaultValue: '')
  final String name;

  @JsonKey(defaultValue: 0)
  final int category_id;

  @JsonKey(defaultValue: '')
  final String category_name;

  @JsonKey(defaultValue: '')
  final String tags;

  @JsonKey(defaultValue: 0)
  final int quantity;

  @JsonKey(defaultValue: 0)
  final double unit_price;

  @JsonKey(defaultValue: 0)
  final int available_stocks;

  @JsonKey(defaultValue: 0)
  final int m_qty;

  @JsonKey(defaultValue: '')
  final String unit;

  @JsonKey(defaultValue: [])
  final List<MAttribute> stocks;

  MProduct({
    required this.id,
    required this.name,
    required this.category_id,
    required this.category_name,
    required this.tags,
    required this.quantity,
    required this.unit_price,
    required this.available_stocks,
    required this.m_qty,
    required this.unit,
    required this.stocks,
  });

  Map<String, dynamic> toMap() => _$MProductToJson(this);

  factory MProduct.fromJson(Map<String, dynamic> map) => _$MProductFromJson(map);
}

class MProductItem {
  late int product_id;
  late String product_name;
  late int category_id;
  late String category_name;
  late int quantity;
  late double price_per_unit;
  late int available_stocks;
  late String unit;
  late int stock_id;

  double get totalCost => quantity * price_per_unit;

  MProductItem({
    required this.product_id,
    required this.product_name,
    required this.category_id,
    required this.category_name,
    required this.quantity,
    required this.price_per_unit,
    required this.available_stocks,
    required this.unit,
    required this.stock_id,
  });

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'product_id': product_id,
      'product_name': product_name,
      'category_id': category_id,
      'category_name': category_name,
      'quantity': quantity,
      'price_per_unit': price_per_unit,
      'available_stocks': available_stocks,
      'unit': unit,
      'stock_id': stock_id,
    };
  }

  factory MProductItem.fromJson(Map<String, dynamic> map) {
    return MProductItem(
      product_id: (map['product_id'] ?? 0) as int,
      product_name: map['product_name'] as String,
      category_id: map['category_id'] as int,
      category_name: map['category_name'] as String,
      quantity: map['quantity'] as int,
      price_per_unit: (map['price_per_unit'] ?? 0) * 1.0,
      available_stocks: (map['available_stocks'] ?? 0) as int,
      unit: map['unit'] as String,
      stock_id: (map['stock_id'] ?? 0) as int,
    );
  }
}
