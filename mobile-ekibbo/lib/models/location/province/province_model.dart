import 'package:json_annotation/json_annotation.dart';
part 'province_model.g.dart';

@JsonSerializable()
class ProvinceModel {
  int? id;
  @JsonKey(name: 'province_name')
  String? provinceName;
  @JsonKey(name: 'province_code')
  String? provinceCode;
  @JsonKey(name: 'country_id')
  int? countryId;

  ProvinceModel();
  factory ProvinceModel.fromJson(Map<String, dynamic> json) =>
      _$ProvinceModelFromJson(json);

  toMap() => _$ProvinceModelToJson(this);
}
