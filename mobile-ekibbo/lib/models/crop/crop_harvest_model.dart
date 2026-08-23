// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:json_annotation/json_annotation.dart';

part 'crop_harvest_model.g.dart';

@JsonSerializable()
class MCropHarvest {
  @JsonKey(defaultValue: 0)
  final int id;

  @JsonKey(name: 'crop_harvest_code', defaultValue: '')
  final String cropHarvestCode;

  @JsonKey(defaultValue: '')
  final String variety;

  @JsonKey(defaultValue: '')
  final String crop;

  @JsonKey(name: 'sub_total', defaultValue: 0)
  double subTotal;

  @JsonKey(name: 'price_per_unit', defaultValue: 0)
  final double pricePerUnit;

  @JsonKey(name: 'loan_amount', defaultValue: 0)
  final double loanAmount;

  @JsonKey(name: 'approx_harvest_qty', defaultValue: 0)
  final double approxHarvestQty;

  @JsonKey(name: 'farmer_name', defaultValue: '')
  final String farmerName;

  @JsonKey(name: 'harvest_date', defaultValue: '')
  final String harvestDate;

  MCropHarvest({
    required this.id,
    required this.cropHarvestCode,
    required this.variety,
    required this.crop,
    required this.subTotal,
    required this.pricePerUnit,
    required this.loanAmount,
    required this.approxHarvestQty,
    required this.farmerName,
    required this.harvestDate,
  }) {
    actualQty = approxHarvestQty;
    farmerPayment = actualQty * pricePerUnit;
    subTotal = farmerPayment - loanAmount;
  }

  late double actualQty;
  late double farmerPayment;

  calculatorPrice(double actualQty) {
    this.actualQty = actualQty;
    farmerPayment = this.actualQty * pricePerUnit;
    subTotal = farmerPayment - loanAmount;
  }

  toMap() => {"crop_harvest_detail_id": id, "actual_qty": actualQty};

  factory MCropHarvest.fromJson(Map<String, dynamic> map) =>
      _$MCropHarvestFromJson(map);
}
