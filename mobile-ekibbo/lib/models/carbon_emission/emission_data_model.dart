import 'package:json_annotation/json_annotation.dart';

part 'emission_data_model.g.dart';

@JsonSerializable()
class EmissionDataModel {
  int? id;
  @JsonKey(name: 'carbon_emissions_id')
  int? carbonEmissionsId;
  double? cultivation;
  double? hgh;
  @JsonKey(name: 'crop_establish')
  double? cropEstablish;
  @JsonKey(name: 'water_soil')
  double? waterSoil;
  double? fetilizer;
  int? equipment;
  int? harvesting;
  @JsonKey(name: 'straw_management')
  int? strawManagement;
  int? drying;
  double? storing;
  double? milling;
  double? packaging;
  double? transports;
  @JsonKey(name: 'co2_emission')
  double? co2Emission;
  @JsonKey(name: 'ch4_emission')
  double? ch4Emission;
  @JsonKey(name: 'n20_emission')
  double? n20Emission;
  @JsonKey(name: 'ghg_emission')
  double? ghgEmission;
  @JsonKey(name: 'carbon_foot_print')
  double? carbonFootPrint;
  String? createdAt;
  String? updatedAt;
  EmissionDataModel();
  factory EmissionDataModel.fromJson(Map<String, dynamic> json) =>
      _$EmissionDataModelFromJson(json);
}
