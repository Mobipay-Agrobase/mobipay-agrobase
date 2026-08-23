import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:agrobase_ekibbo/models/carbon_emission/emission_data_model.dart';
import 'package:agrobase_ekibbo/models/carbon_emission/product_data_loss_model.dart';
part 'carbon_emission_response.g.dart';

@JsonSerializable()
class CarbonEmissionResponse {
  @JsonKey(name: 'data_emission')
  EmissionDataModel? dataEmission;
  @JsonKey(name: 'data_product_loss')
  ProductDataLossModel? dataProductLoss;
  CarbonEmissionResponse();
  factory CarbonEmissionResponse.fromJson(Map<String, dynamic> json) =>
      _$CarbonEmissionResponseFromJson(json);
}
