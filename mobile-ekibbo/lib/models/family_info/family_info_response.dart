import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/family_info/family_info_model.dart';
part 'family_info_response.g.dart';

@JsonSerializable()
class FamilyInfoResponse {
  @JsonKey(name: 'data_education')
  List<DropdownDataModel>? dataEducation;
  @JsonKey(name: 'data_marial_status')
  List<DropdownDataModel>? dataMarialStatus;
  @JsonKey(name: 'family_info')
  FamilyInfoModel? familyInfo;

  FamilyInfoResponse();
  factory FamilyInfoResponse.fromJson(Map<String, dynamic> json) =>
      _$FamilyInfoResponseFromJson(json);
}
