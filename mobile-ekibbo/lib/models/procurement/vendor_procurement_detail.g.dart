// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'vendor_procurement_detail.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MRVendorProcurementDetail _$MRVendorProcurementDetailFromJson(
        Map<String, dynamic> json) =>
    MRVendorProcurementDetail(
      id: json['id'] as int? ?? 0,
      productId: json['product_id'] as String? ?? '0',
      productName: json['product_name'] as String? ?? '',
      saleIntentionId: json['sale_intention_id'] as int? ?? 0,
      photos: (json['photos'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      postHarvestQC: (json['post_harvest_qc'] as List<dynamic>?)
              ?.map((e) => MPreHarvestQC.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );

Map<String, dynamic> _$MRVendorProcurementDetailToJson(
        MRVendorProcurementDetail instance) =>
    <String, dynamic>{
      'id': instance.id,
      'product_id': instance.productId,
      'product_name': instance.productName,
      'sale_intention_id': instance.saleIntentionId,
      'photos': instance.photos,
      'post_harvest_qc': instance.postHarvestQC,
    };
