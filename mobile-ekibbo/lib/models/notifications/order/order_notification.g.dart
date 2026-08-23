// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'order_notification.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MOrderNotification _$MOrderNotificationFromJson(Map<String, dynamic> json) =>
    MOrderNotification(
      id: json['id'] as int? ?? 0,
      combinedOrderId: json['combined_order_id'] as int? ?? 0,
      userId: json['user_id'] as int? ?? 0,
      sellerId: json['seller_id'] as int? ?? 0,
      shippingAddress: json['shipping_address'] as String? ?? '',
      shippingType: json['shipping_type'] as String? ?? '',
      orderFrom: json['order_from'] as String? ?? '',
      pickupPointId: json['pickup_point_id'] as int? ?? 0,
      deliveryStatus: json['delivery_status'] as String? ?? '',
      paymentType: json['payment_type'] as String? ?? '',
      manualPayment: json['manual_payment'] as int? ?? 0,
      manualPaymentData: json['manual_payment_data'] as String? ?? '',
      paymentStatus: json['payment_status'] as String? ?? '',
      grandTotal: json['grand_total'] as int? ?? 0,
      couponDiscount: json['coupon_discount'] as int? ?? 0,
      code: json['code'] as String? ?? '',
      date: json['date'] as int? ?? 0,
      viewed: json['viewed'] as int? ?? 0,
      deliveryViewed: json['delivery_viewed'] as int? ?? 0,
      cancelRequest: json['cancel_request'] as int? ?? 0,
      cancelRequestAt: json['cancel_request_at'] as int? ?? 0,
      paymentStatusViewed: json['payment_status_viewed'] as int? ?? 0,
      commissionCalculated: json['commission_calculated'] as int? ?? 0,
      deliveryHistoryDate: json['delivery_history_date'] as String? ?? '',
      createdAt: json['created_at'] as String? ?? '',
      updatedAt: json['updated_at'] as String? ?? '',
      orderDetail: (json['order_detail'] as List<dynamic>?)
              ?.map((e) => MOrderDetail.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );

Map<String, dynamic> _$MOrderNotificationToJson(MOrderNotification instance) =>
    <String, dynamic>{
      'id': instance.id,
      'combined_order_id': instance.combinedOrderId,
      'user_id': instance.userId,
      'seller_id': instance.sellerId,
      'shipping_address': instance.shippingAddress,
      'shipping_type': instance.shippingType,
      'order_from': instance.orderFrom,
      'pickup_point_id': instance.pickupPointId,
      'delivery_status': instance.deliveryStatus,
      'payment_type': instance.paymentType,
      'manual_payment': instance.manualPayment,
      'manual_payment_data': instance.manualPaymentData,
      'payment_status': instance.paymentStatus,
      'grand_total': instance.grandTotal,
      'coupon_discount': instance.couponDiscount,
      'code': instance.code,
      'date': instance.date,
      'viewed': instance.viewed,
      'delivery_viewed': instance.deliveryViewed,
      'cancel_request': instance.cancelRequest,
      'cancel_request_at': instance.cancelRequestAt,
      'payment_status_viewed': instance.paymentStatusViewed,
      'commission_calculated': instance.commissionCalculated,
      'delivery_history_date': instance.deliveryHistoryDate,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
      'order_detail': instance.orderDetail,
    };
