import 'package:json_annotation/json_annotation.dart';

part 'district_model.g.dart';

@JsonSerializable()
class DistrictModel {
  int? id;
  @JsonKey(name: 'district_name')
  String? districtName;
  @JsonKey(name: 'district_code')
  String? districtCode;
  @JsonKey(name: 'province_id')
  int? provinceId;

  DistrictModel();
  factory DistrictModel.fromJson(Map<String, dynamic> json) =>
      _$DistrictModelFromJson(json);

  toMap() => _$DistrictModelToJson(this);
}
