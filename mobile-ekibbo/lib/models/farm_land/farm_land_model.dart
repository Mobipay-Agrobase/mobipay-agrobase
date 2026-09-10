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
  // Second review (G): typology/gradient/approach road/photos/land document
  // removed; replaced by neighbouring physical features + access map.
  @JsonKey(name: 'neighbouring_features')
  String? neighbouringFeatures; // JSON array string
  @JsonKey(name: 'access_map_lat')
  String? accessMapLat;
  @JsonKey(name: 'access_map_lng')
  String? accessMapLng;
  String? lat;
  String? lng;
  List<FarmPlottingModel>? farmPlottings;
  @JsonKey(name: 'farmer_details')
  FarmerModel? farmerDetails;

  String tag = '';
  String listLatLng = '';

  // ── Web-parity datapoints (FarmLandFormPage) ──
  // Second review (G): land survey no / water source / power source removed
  @JsonKey(name: 'soil_fertility')
  String? soilFertility;
  @JsonKey(name: 'irrigation_type')
  String? irrigationType;
  @JsonKey(name: 'est_yield')
  String? estYield;
  @JsonKey(name: 'full_time_workers')
  String? fullTimeWorkers;
  @JsonKey(name: 'part_time_workers')
  String? partTimeWorkers;
  @JsonKey(name: 'seasonal_workers')
  String? seasonalWorkers;
  @JsonKey(name: 'family_workers')
  String? familyWorkers;

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
