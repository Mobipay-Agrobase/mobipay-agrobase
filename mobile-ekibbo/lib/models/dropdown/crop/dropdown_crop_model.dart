import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';

part 'dropdown_crop_model.g.dart';

@JsonSerializable()
class DropdownCropModel {
  List<SeasonModel>? season;
  @JsonKey(name: 'crop_information')
  List<DropdownMasterModel>? cropInformation;
  @JsonKey(name: 'farm_land')
  List<FarmLandModel>? farmLand;

  DropdownCropModel();
  factory DropdownCropModel.fromJson(Map<String, dynamic> json) =>
      _$DropdownCropModelFromJson(json);
}
