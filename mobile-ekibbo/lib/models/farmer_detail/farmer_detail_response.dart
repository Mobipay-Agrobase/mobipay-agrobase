import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';

part 'farmer_detail_response.g.dart';

@JsonSerializable()
class FarmerDetailResponse {
  @JsonKey(name: 'farmer_data')
  FarmerModel? farmerData;
  FarmerDetailResponse();
  factory FarmerDetailResponse.fromJson(Map<String, dynamic> json) =>
      _$FarmerDetailResponseFromJson(json);
}
