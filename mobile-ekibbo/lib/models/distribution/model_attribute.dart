// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:json_annotation/json_annotation.dart';

part 'model_attribute.g.dart';

@JsonSerializable()
class MAttribute {
  @JsonKey(defaultValue: 0)
  final int id;
  @JsonKey(defaultValue: '')
  final String variant;
  @JsonKey(defaultValue: '')
  final String sku;
  @JsonKey(name: 'price_per_unit', defaultValue: 0)
  final double pricePerUnit;
  @JsonKey(name: 'available_stocks', defaultValue: 0)
  final int availableStocks;

  MAttribute({
    required this.id,
    required this.variant,
    required this.sku,
    required this.pricePerUnit,
    required this.availableStocks,
  });

  Map<String, dynamic> toMap() => _$MAttributeToJson(this);

  factory MAttribute.fromJson(Map<String, dynamic> map) =>
      _$MAttributeFromJson(map);
}
