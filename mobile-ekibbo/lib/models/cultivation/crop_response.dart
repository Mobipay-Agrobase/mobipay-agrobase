import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';

part 'crop_response.g.dart';

@JsonSerializable()
class CropResponse {
  @JsonKey(name: 'cultivation_data')
  CultivationModel? cultivationData;
  @JsonKey(name: 'season_master')
  List<SeasonModel>? seasonMaster;
  @JsonKey(name: 'crop_master')
  List<DropdownMasterModel>? cropMaster;
  @JsonKey(name: 'farm_land')
  List<FarmLandModel>? farmLand;
  @JsonKey(name: 'carbon_emission_id')
  int? carbonEmissionId;
  CropResponse();
  factory CropResponse.fromJson(Map<String, dynamic> json) =>
      _$CropResponseFromJson(json);
}
