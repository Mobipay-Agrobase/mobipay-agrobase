import 'packag
    this.landSurveyNo,
    this.waterSource,
    this.powerSource,
    this.soilFertility,
    this.irrigationType,
    this.estYield,
    this.fullTimeWorkers,
    this.partTimeWorkers,
    this.seasonalWorkers,
    this.familyWorkers,e:json_annotation/json_annotation.dart';
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
  // Web-parity datapoints (FarmLandFormPage)
  @JsonKey(name: 'land_survey_no')
  String? landSurveyNo;
  @JsonKey(name: 'water_source')
  String? waterSource;
  @JsonKey(name: 'power_source')
  String? powerSource;
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
