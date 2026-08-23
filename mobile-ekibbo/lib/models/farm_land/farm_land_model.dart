import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';

part 'farm_land_model.g.dart';

@JsonSerializable()
class FarmLandModel {
  int? id;
  @JsonKey(name: 'farm_name')
  String? farmName;
  @JsonKey(name: 'farmer_id')
  int? farmerId;
  @JsonKey(name: 'total_land_holding')
  double? totalLandHolding;
  @JsonKey(name: 'total_cultivation')
  int? totalCultivation;
  List<CultivationModel>? cultivation;
  @JsonKey(name: 'actual_area')
  String? actualArea;
  @JsonKey(name: 'land_ownership')
  String? landOwnership;
  @JsonKey(name: 'approach_road')
  String? approachRoad;
  @JsonKey(name: 'land_topology')
  String? landTopology;
  @JsonKey(name: 'land_gradient')
  String? landGradient;
  @JsonKey(name: 'farm_photo')
  String? farmPhoto;
  @JsonKey(name: 'land_document')
  String? landDocument;
  String? lat;
  String? lng;
  List<FarmPlottingModel>? farmPlottings;
  @JsonKey(name: 'farmer_details')
  FarmerModel? farmerDetails;

  String tag = '';
  String listLatLng = '';

  FarmLandModel();
  factory FarmLandModel.fromJson(Map<String, dynamic> json) =>
      _$FarmLandModelFromJson(json);

  toMap() => _$FarmLandModelToJson(this);
}

@JsonSerializable()
class FarmPlottingModel {
  int? id;
  int? oderId;
  String? lat;
  String? lng;
  FarmPlottingModel();
  factory FarmPlottingModel.fromJson(Map<String, dynamic> json) =>
      _$FarmPlottingModelFromJson(json);
}
