// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:json_annotation/json_annotation.dart';

import 'package:agrobase_ekibbo/models/distribution/model_product.dart';

part 'model_distribution.g.dart';

@JsonSerializable()
class MDistribution {
  @JsonKey(defaultValue: 0)
  final int id;

  @JsonKey(defaultValue: '', name: 'receipt_no')
  final String receiptNo;

  @JsonKey(defaultValue: 0, name: 'farmer_id')
  final int farmerId;

  @JsonKey(defaultValue: '', name: 'province_name')
  final String provinceName;

  @JsonKey(defaultValue: '', name: 'commune_name')
  final String communeName;

  @JsonKey(defaultValue: '', name: 'cooperative_name')
  final String cooperativeName;

  @JsonKey(defaultValue: '', name: 'farmer_name')
  final String farmerName;

  @JsonKey(defaultValue: 0, name: 'agent_id')
  final int agentId;

  @JsonKey(defaultValue: 0, name: 'total_amount')
  final double totalAmount;

  @JsonKey(defaultValue: '', name: 'created_at')
  final String createdAt;

  @JsonKey(defaultValue: [], name: 'distribution_details')
  final List<MProductItem> distributionDetails;

  MDistribution({
    required this.id,
    required this.receiptNo,
    required this.farmerId,
    required this.provinceName,
    required this.communeName,
    required this.cooperativeName,
    required this.farmerName,
    required this.agentId,
    required this.totalAmount,
    required this.createdAt,
    required this.distributionDetails,
  });

  Map<String, dynamic> toMap() => _$MDistributionToJson(this);

  factory MDistribution.fromJson(Map<String, dynamic> map) =>
      _$MDistributionFromJson(map);
}

class DataDistribution {
  final List<MDistribution> distributions;
  DataDistribution({
    required this.distributions,
  });

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'data': distributions.map((x) => x.toMap()).toList(),
    };
  }

  factory DataDistribution.fromJson(Map<String, dynamic> map) {
    return DataDistribution(
      distributions: List<MDistribution>.from(
        ((map['data'] ?? []) as List<dynamic>).map<MDistribution>(
          (x) => MDistribution.fromJson(x as Map<String, dynamic>),
        ),
      ),
    );
  }
}
