// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'model_distribution.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MDistribution _$MDistributionFromJson(Map<String, dynamic> json) =>
    MDistribution(
      id: json['id'] as int? ?? 0,
      receiptNo: json['receipt_no'] as String? ?? '',
      farmerId: json['farmer_id'] as int? ?? 0,
      provinceName: json['province_name'] as String? ?? '',
      communeName: json['commune_name'] as String? ?? '',
      cooperativeName: json['cooperative_name'] as String? ?? '',
      farmerName: json['farmer_name'] as String? ?? '',
      agentId: json['agent_id'] as int? ?? 0,
      totalAmount: (json['total_amount'] ?? 0) * 1.0,
      createdAt: json['created_at'] as String? ?? '',
      distributionDetails:
          ((json['distribution_details'] ?? []) as List<dynamic>)
              .map((e) => MProductItem.fromJson(e as Map<String, dynamic>))
              .toList(),
    );

Map<String, dynamic> _$MDistributionToJson(MDistribution instance) =>
    <String, dynamic>{
      'id': instance.id,
      'receipt_no': instance.receiptNo,
      'farmer_id': instance.farmerId,
      'province_name': instance.provinceName,
      'commune_name': instance.communeName,
      'cooperative_name': instance.cooperativeName,
      'farmer_name': instance.farmerName,
      'agent_id': instance.agentId,
      'total_amount': instance.totalAmount,
      'created_at': instance.createdAt,
      'distribution_details': instance.distributionDetails,
    };
