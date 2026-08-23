import 'package:json_annotation/json_annotation.dart';

part 'dropdown_data_model.g.dart';

@JsonSerializable()
class DropdownDataModel {
  @JsonKey(name: 'ID')
  int? id;
  
  @JsonKey(name: 'NAME')
  String? name;


  DropdownDataModel();
  factory DropdownDataModel.fromJson(Map<String, dynamic> json) =>
      _$DropdownDataModelFromJson(json);

  Map<String, dynamic> toJson() => _$DropdownDataModelToJson(this);

}

@JsonSerializable()
class DropdownMasterModel {
  int? id;
  String? name;

  DropdownMasterModel();
  factory DropdownMasterModel.fromJson(Map<String, dynamic> json) =>
      _$DropdownMasterModelFromJson(json);

  Map<String, dynamic> toJson() => _$DropdownMasterModelToJson(this);
}
