// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'vendor_procurement.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MRVendorProcurement _$MRVendorProcurementFromJson(Map<String, dynamic> json) =>
    MRVendorProcurement(
      id: json['id'] as int? ?? 0,
      vendorProcurementCode: json['vendor_procurement_code'] as String? ?? '',
      transactionDate: json['transaction_date'] as String? ?? '',
      lat: (json['lat'] as num?)?.toDouble() ?? 0,
      lng: (json['lng'] as num?)?.toDouble() ?? 0,
      orderId: json['order_id'] as int? ?? 0,
      orderCode: json['order_code'] as String? ?? '',
      photos: (json['photos'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      vendorProcurementDetail: json['vendor_procurement_detail'] == null
          ? null
          : MRVendorProcurementDetail.fromJson(
              json['vendor_procurement_detail'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$MRVendorProcurementToJson(
        MRVendorProcurement instance) =>
    <String, dynamic>{
      'id': instance.id,
      'vendor_procurement_code': instance.vendorProcurementCode,
      'transaction_date': instance.transactionDate,
      'lat': instance.lat,
      'lng': instance.lng,
      'order_id': instance.orderId,
      'order_code': instance.orderCode,
      'photos': instance.photos,
      'vendor_procurement_detail': instance.vendorProcurementDetail,
    };
