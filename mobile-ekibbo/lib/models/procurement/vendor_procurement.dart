// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:json_annotation/json_annotation.dart';

import 'package:agrobase_ekibbo/models/procurement/vendor_procurement_detail.dart';

part 'vendor_procurement.g.dart';

@JsonSerializable()
class MRVendorProcurement {
  @JsonKey(defaultValue: 0)
  final int id;
  @JsonKey(defaultValue: '', name: 'vendor_procurement_code')
  final String vendorProcurementCode;
  @JsonKey(defaultValue: '', name: 'transaction_date')
  final String transactionDate;
  @JsonKey(defaultValue: 0)
  final double lat;
  @JsonKey(defaultValue: 0)
  final double lng;
  @JsonKey(defaultValue: 0, name: 'order_id')
  final int orderId;
  @JsonKey(defaultValue: '', name: 'order_code')
  final String orderCode;
  @JsonKey(defaultValue: [])
  final List<String> photos;
  @JsonKey(defaultValue: null, name: 'vendor_procurement_detail')
  final MRVendorProcurementDetail? vendorProcurementDetail;

  MRVendorProcurement({
    required this.id,
    required this.vendorProcurementCode,
    required this.transactionDate,
    required this.lat,
    required this.lng,
    required this.orderId,
    required this.orderCode,
    required this.photos,
    required this.vendorProcurementDetail,
  });

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'vendorProcurementCode': vendorProcurementCode,
      'transactionDate': transactionDate,
      'lat': lat,
      'lng': lng,
      'orderId': orderId,
      'orderCode': orderCode,
      'photos': photos,
      'vendorProcurementDetail': vendorProcurementDetail?.toMap(),
    };
  }

  factory MRVendorProcurement.fromJson(Map<String, dynamic> json) =>
      _$MRVendorProcurementFromJson(json);
}
