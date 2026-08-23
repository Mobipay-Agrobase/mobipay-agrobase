// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:json_annotation/json_annotation.dart';

import 'package:agrobase_ekibbo/models/sale_intention/pre_harvest_model.dart';

part 'vendor_procurement_detail.g.dart';

@JsonSerializable()
class MRVendorProcurementDetail {
  @JsonKey(defaultValue: 0)
  final int id;
  @JsonKey(defaultValue: '0', name: 'product_id')
  final String productId;
  @JsonKey(defaultValue: '', name: 'product_name')
  final String productName;
  @JsonKey(defaultValue: 0, name: 'sale_intention_id')
  final int saleIntentionId;
  @JsonKey(defaultValue: [])
  final List<String> photos;
  @JsonKey(defaultValue: [], name: 'post_harvest_qc')
  final List<MPreHarvestQC> postHarvestQC;

  MRVendorProcurementDetail({
    required this.id,
    required this.productId,
    required this.productName,
    required this.saleIntentionId,
    required this.photos,
    required this.postHarvestQC,
  });

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'productId': productId,
      'productName': productName,
      'saleIntentionId': saleIntentionId,
      'photos': photos,
      'postHarvestQC': postHarvestQC.map((x) => x.toMap()).toList(),
    };
  }

  factory MRVendorProcurementDetail.fromJson(Map<String, dynamic> json) =>
      _$MRVendorProcurementDetailFromJson(json);
}
