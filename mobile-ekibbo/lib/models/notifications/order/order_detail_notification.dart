// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

import 'package:json_annotation/json_annotation.dart';

part 'order_detail_notification.g.dart';

@JsonSerializable()
class MOrderDetail {
  @JsonKey(defaultValue: 0)
  final int id;
  @JsonKey(defaultValue: 0, name: 'product_id')
  final int productId;
  @JsonKey(defaultValue: '', name: 'product_name')
  final String productName;
  @JsonKey(defaultValue: 0)
  final int quantity;
  @JsonKey(defaultValue: '', name: 'payment_status')
  final String paymentStatus;
  @JsonKey(defaultValue: '', name: 'delivery_status')
  final String deliveryStatus;
  @JsonKey(defaultValue: '', name: 'shipping_type')
  final String shippingType;
  @JsonKey(defaultValue: 0)
  final double price;
  @JsonKey(defaultValue: 0)
  final int tax;
  @JsonKey(defaultValue: 0, name: 'shipping_cost')
  final double shippingCost;
  @JsonKey(defaultValue: '', name: 'seller_name')
  final String sellerName;
  @JsonKey(defaultValue: 0, name: 'sale_intention_id')
  final int saleIntentionId;
  @JsonKey(defaultValue: '')
  final String unit;

  MOrderDetail({
    required this.id,
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.paymentStatus,
    required this.deliveryStatus,
    required this.shippingType,
    required this.price,
    required this.tax,
    required this.shippingCost,
    required this.sellerName,
    required this.saleIntentionId,
    required this.unit,
  });

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'productId': productId,
      'productName': productName,
      'quantity': quantity,
      'paymentStatus': paymentStatus,
      'deliveryStatus': deliveryStatus,
      'shippingType': shippingType,
      'price': price,
      'tax': tax,
      'shippingCost': shippingCost,
      'sellerName': sellerName,
    };
  }

  factory MOrderDetail.fromJson(Map<String, dynamic> json) =>
      _$MOrderDetailFromJson(json);

  String toJson() => json.encode(toMap());
}
