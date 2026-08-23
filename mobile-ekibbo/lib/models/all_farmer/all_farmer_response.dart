import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
part 'all_farmer_response.g.dart';

@JsonSerializable()
class AllFarmerResponse {
  @JsonKey(name: 'farmer_data')
  AllFarmerDataModel? farmerData;
  AllFarmerResponse();
  factory AllFarmerResponse.fromJson(Map<String, dynamic> json) =>
      _$AllFarmerResponseFromJson(json);
}

@JsonSerializable()
class AllFarmerDataModel {
  List<FarmerModel>? data;
  @JsonKey(name: 'current_page')
  int? currentPage;
  @JsonKey(name: 'last_page')
  int? lastPage;
  AllFarmerDataModel();
  factory AllFarmerDataModel.fromJson(Map<String, dynamic> json) =>
      _$AllFarmerDataModelFromJson(json);
}
