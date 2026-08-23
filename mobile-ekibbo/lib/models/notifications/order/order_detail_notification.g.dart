// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'order_detail_notification.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MOrderDetail _$MOrderDetailFromJson(Map<String, dynamic> json) => MOrderDetail(
      id: json['id'] as int? ?? 0,
      productId: json['product_id'] as int? ?? 0,
      productName: json['product_name'] as String? ?? '',
      quantity: json['quantity'] as int? ?? 0,
      paymentStatus: json['payment_status'] as String? ?? '',
      deliveryStatus: json['delivery_status'] as String? ?? '',
      shippingType: json['shipping_type'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      tax: json['tax'] as int? ?? 0,
      shippingCost: (json['shipping_cost'] as num?)?.toDouble() ?? 0,
      sellerName: json['seller_name'] as String? ?? '',
      saleIntentionId: json['sale_intention_id'] as int? ?? 0,
      unit: json['unit'] as String? ?? '',
    );

Map<String, dynamic> _$MOrderDetailToJson(MOrderDetail instance) =>
    <String, dynamic>{
      'id': instance.id,
      'product_id': instance.productId,
      'product_name': instance.productName,
      'quantity': instance.quantity,
      'payment_status': instance.paymentStatus,
      'delivery_status': instance.deliveryStatus,
      'shipping_type': instance.shippingType,
      'price': instance.price,
      'tax': instance.tax,
      'shipping_cost': instance.shippingCost,
      'seller_name': instance.sellerName,
      'sale_intention_id': instance.saleIntentionId,
      'unit': instance.unit,
    };
