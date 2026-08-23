import 'dart:convert';
import 'package:agrobase_ekibbo/models/sale_intention/pre_harvest_model.dart';

// ignore_for_file: public_member_api_docs, sort_constructors_first
class MVendorProcurementRequest {
  final int seasonId;
  final double lat;
  final double lng;
  final int orderId;
  final int productId;
  final String productName;
  final String orderCode;
  final int quantity;
  List<MPreHarvestQC> postHarvestQC;

  MVendorProcurementRequest({
    required this.seasonId,
    required this.lat,
    required this.lng,
    required this.orderId,
    required this.productId,
    required this.productName,
    required this.orderCode,
    required this.quantity,
    required this.postHarvestQC,
  });

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'season_id': seasonId,
      'lat': lat,
      'lng': lng,
      'order_id': orderId,
      'product_id': productId,
      'product_name': productName,
      'order_code': orderCode,
      'quantity': quantity,
      'post_harvest_qc': postHarvestQC.map((e) => e.toMap()).toList()
    };
  }

  String toJson() => json.encode(toMap());
}
