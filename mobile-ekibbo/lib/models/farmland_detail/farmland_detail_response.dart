import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';

part 'farmland_detail_response.g.dart';

@JsonSerializable()
class FarmlandDetailResponse {
  @JsonKey(name: 'farm_land_data')
  FarmLandModel? farmLandData;
  @JsonKey(name: 'farm_land_ploting')
  List<FarmPlottingModel>? farmLandPloting;
  FarmlandDetailResponse();
  factory FarmlandDetailResponse.fromJson(Map<String, dynamic> json) =>
      _$FarmlandDetailResponseFromJson(json);
}
