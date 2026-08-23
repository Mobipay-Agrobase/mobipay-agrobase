import 'package:json_annotation/json_annotation.dart';
part 'product_data_loss_model.g.dart';

@JsonSerializable()
class ProductDataLossModel {
  @JsonKey(name: 'total_product_loss')
  double? totalProductLoss;
  ProductDataLossModel();
  factory ProductDataLossModel.fromJson(Map<String, dynamic> json) =>
      _$ProductDataLossModelFromJson(json);
}
