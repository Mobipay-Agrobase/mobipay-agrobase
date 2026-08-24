import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';

part 'dropdown_crop_model.g.dart';

/// Crop variety row from the web CropVariety master, carrying the parent
/// crop id so the mobile Add-Crop form can filter varieties client-side
/// (variety list depends on the selected crop — Ekibbo requirement).
@JsonSerializable()
class CropVarietyMasterModel {
  int? id;
  String? name;
  @JsonKey(name: 'crop_id')
  int? cropId;

  CropVarietyMasterModel();
  factory CropVarietyMasterModel.fromJson(Map<String, dynamic> json) =>
      _$CropVarietyMasterModelFromJson(json);

  Map<String, dynamic> toJson() => _$CropVarietyMasterModelToJson(this);
}

@JsonSerializable()
class DropdownCropModel {
  List<SeasonModel>? season;
  @JsonKey(name: 'crop_information')
  List<DropdownMasterModel>? cropInformation;

  /// All crop varieties from the CropVariety master (each row knows its
  /// parent crop via `crop_id`). Provided by
  /// GET /mobile/ekibbo-cultivation-dropdowns.
  @JsonKey(name: 'crop_variety')
  List<CropVarietyMasterModel>? cropVariety;
  @JsonKey(name: 'farm_land')
  List<FarmLandModel>? farmLand;

  DropdownCropModel();
  factory DropdownCropModel.fromJson(Map<String, dynamic> json) =>
      _$DropdownCropModelFromJson(json);
}
