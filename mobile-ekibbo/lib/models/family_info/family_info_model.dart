import 'package:json_annotation/json_annotation.dart';
part 'family_info_model.g.dart';

@JsonSerializable()
class FamilyInfoModel {
  int? id;
  @JsonKey(name: 'farmer_id')
  int? farmerId;
  @JsonKey(name: 'marial_status')
  String? marialStatus;
  @JsonKey(name: 'parent_name')
  String? parentName;
  @JsonKey(name: 'spouse_name')
  String? spouseName;
  @JsonKey(name: 'no_of_family')
  String? noOfFamily;
  @JsonKey(name: 'total_child_under_18_going_school')
  String? totalGoingSchool;
  @JsonKey(name: 'total_child_under_18')
  NumChildModel? totalChild;
  String? education;
  FamilyInfoModel();
  factory FamilyInfoModel.fromJson(Map<String, dynamic> json) =>
      _$FamilyInfoModelFromJson(json);
}

@JsonSerializable()
class NumChildModel {
  String? male;
  String? female;
  NumChildModel();

  factory NumChildModel.fromJson(Map<String, dynamic> json) =>
      _$NumChildModelFromJson(json);
}
