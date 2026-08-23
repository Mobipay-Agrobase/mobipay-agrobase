// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:json_annotation/json_annotation.dart';

import 'order_detail_notification.dart';

part 'order_notification.g.dart';

@JsonSerializable()
class MOrderNotification {
  @JsonKey(defaultValue: 0)
  final int id;
  @JsonKey(defaultValue: 0, name: 'combined_order_id')
  final int combinedOrderId;
  @JsonKey(defaultValue: 0, name: 'user_id')
  final int userId;
  @JsonKey(defaultValue: 0, name: 'seller_id')
  final int sellerId;
  @JsonKey(defaultValue: '', name: 'shipping_address')
  final String shippingAddress;
  @JsonKey(defaultValue: '', name: 'shipping_type')
  final String shippingType;
  @JsonKey(defaultValue: '', name: 'order_from')
  final String orderFrom;
  @JsonKey(defaultValue: 0, name: 'pickup_point_id')
  final int pickupPointId;
  @JsonKey(defaultValue: '', name: 'delivery_status')
  final String deliveryStatus;
  @JsonKey(defaultValue: '', name: 'payment_type')
  final String paymentType;
  @JsonKey(defaultValue: 0, name: 'manual_payment')
  final int manualPayment;
  @JsonKey(defaultValue: '', name: 'manual_payment_data')
  final String manualPaymentData;
  @JsonKey(defaultValue: '', name: 'payment_status')
  final String paymentStatus;
  @JsonKey(defaultValue: 0, name: 'grand_total')
  final int grandTotal;
  @JsonKey(defaultValue: 0, name: 'coupon_discount')
  final int couponDiscount;
  @JsonKey(defaultValue: '')
  final String code;
  @JsonKey(defaultValue: 0)
  final int date;
  @JsonKey(defaultValue: 0)
  final int viewed;
  @JsonKey(defaultValue: 0, name: 'delivery_viewed')
  final int deliveryViewed;
  @JsonKey(defaultValue: 0, name: 'cancel_request')
  final int cancelRequest;
  @JsonKey(defaultValue: 0, name: 'cancel_request_at')
  final int cancelRequestAt;
  @JsonKey(defaultValue: 0, name: 'payment_status_viewed')
  final int paymentStatusViewed;
  @JsonKey(defaultValue: 0, name: 'commission_calculated')
  final int commissionCalculated;
  @JsonKey(defaultValue: '', name: 'delivery_history_date')
  final String deliveryHistoryDate;
  @JsonKey(defaultValue: '', name: 'created_at')
  final String createdAt;
  @JsonKey(defaultValue: '', name: 'updated_at')
  final String updatedAt;
  @JsonKey(defaultValue: [], name: 'order_detail')
  final List<MOrderDetail> orderDetail;

  MOrderNotification({
    required this.id,
    required this.combinedOrderId,
    required this.userId,
    required this.sellerId,
    required this.shippingAddress,
    required this.shippingType,
    required this.orderFrom,
    required this.pickupPointId,
    required this.deliveryStatus,
    required this.paymentType,
    required this.manualPayment,
    required this.manualPaymentData,
    required this.paymentStatus,
    required this.grandTotal,
    required this.couponDiscount,
    required this.code,
    required this.date,
    required this.viewed,
    required this.deliveryViewed,
    required this.cancelRequest,
    required this.cancelRequestAt,
    required this.paymentStatusViewed,
    required this.commissionCalculated,
    required this.deliveryHistoryDate,
    required this.createdAt,
    required this.updatedAt,
    required this.orderDetail,
  });

  factory MOrderNotification.fromJson(Map<String, dynamic> json) =>
      _$MOrderNotificationFromJson(json);
}

class MOrderResponse {
  final MOrderNotification order;
  MOrderResponse({
    required this.order,
  });

  factory MOrderResponse.fromJson(Map<String, dynamic> json) {
    return MOrderResponse(
      order: MOrderNotification.fromJson(json['order'] as Map<String, dynamic>),
    );
  }
}
