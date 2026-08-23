import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
part 'cultivation_model.g.dart';

@JsonSerializable()
class CultivationModel {
  int? id;
  @JsonKey(name: 'farm_land_id')
  int? farmLandId;
  @JsonKey(name: 'crop_variety')
  String? cropVariety;
  @JsonKey(name: 'sowing_date')
  String? sowingDate;
  @JsonKey(name: 'expect_date')
  String? expectDate;
  @JsonKey(name: 'est_yield')
  String? estYield;
  @JsonKey(name: 'crops_master')
  DropdownMasterModel? cropsMaster;
  SeasonModel? season;
  String? photo;
  @JsonKey(name: 'photo_url')
  String? photoUrl;
  @JsonKey(name: 'crop_name')
  String? cropName;
  CultivationModel();
  factory CultivationModel.fromJson(Map<String, dynamic> json) =>
      _$CultivationModelFromJson(json);
  
  toMap() => _$CultivationModelToJson(this);
}

@JsonSerializable()
class SeasonModel {
  int? id;
  @JsonKey(name: 'season_name')
  String? seasonName;
  String? name;
  SeasonModel();
  factory SeasonModel.fromJson(Map<String, dynamic> json) =>
      _$SeasonModelFromJson(json);
}
