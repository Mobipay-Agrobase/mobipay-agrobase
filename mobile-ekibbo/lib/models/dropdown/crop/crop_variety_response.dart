import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
part 'crop_variety_response.g.dart';

@JsonSerializable()
class CropVarietyResponse {
  @JsonKey(name: 'crop_variety')
  List<DropdownMasterModel>? cropVariety;

  CropVarietyResponse();
  factory CropVarietyResponse.fromJson(Map<String, dynamic> json) =>
      _$CropVarietyResponseFromJson(json);
}
