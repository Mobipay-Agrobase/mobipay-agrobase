import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
part 'drodown_farmland_model.g.dart';

@JsonSerializable()
class DropdownFarmLandModel {
  @JsonKey(name: 'data_appoarch_road')
  List<DropdownDataModel>? dataAppoarchRoad;
  @JsonKey(name: 'data_land_topolog')
  List<DropdownDataModel>? dataLandTopolog;
  @JsonKey(name: 'data_land_gradient')
  List<DropdownDataModel>? dataLandGradient;
  @JsonKey(name: 'data_land_document')
  List<DropdownDataModel>? dataLandDocument;
  @JsonKey(name: 'data_land_owner_ship')
  List<DropdownDataModel>? dataLandWwnerShip;
  @JsonKey(name: 'all_farmer')
  List<FarmerModel>? allFarmer;

  DropdownFarmLandModel();
  factory DropdownFarmLandModel.fromJson(Map<String, dynamic> json) =>
      _$DropdownFarmLandModelFromJson(json);
}
