import 'package:json_annotation/json_annotation.dart';
part 'commune_model.g.dart';

@JsonSerializable()
class CommuneModel {
  int? id;
  @JsonKey(name: 'commune_name')
  String? communeName;
  @JsonKey(name: 'commune_code')
  String? communeCode;
  @JsonKey(name: 'district_id')
  int? districtId;

  CommuneModel();
  factory CommuneModel.fromJson(Map<String, dynamic> json) =>
      _$CommuneModelFromJson(json);

  toMap() => _$CommuneModelToJson(this);
}
