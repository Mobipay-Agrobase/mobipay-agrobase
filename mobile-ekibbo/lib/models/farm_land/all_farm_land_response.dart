import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
part 'all_farm_land_response.g.dart';

@JsonSerializable()
class AllFarmLandResponse {
  @JsonKey(name: 'farm_land_data')
  List<FarmLandModel>? farmLandData;

  AllFarmLandResponse();
  factory AllFarmLandResponse.fromJson(Map<String, dynamic> json) =>
      _$AllFarmLandResponseFromJson(json);
}
