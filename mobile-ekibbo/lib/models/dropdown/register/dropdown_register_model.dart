import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
part 'dropdown_register_model.g.dart';

@JsonSerializable()
class DropdownRegisterModel {
  @JsonKey(name: 'data_identity_proof')
  List<DropdownDataModel>? dataIdentityProof;
  @JsonKey(name: 'data_enrollment_place')
  List<DropdownDataModel>? dataEnrollmentPlace;
  @JsonKey(name: 'data_gender')
  List<DropdownDataModel>? dataGender;

  DropdownRegisterModel();
  factory DropdownRegisterModel.fromJson(Map<String, dynamic> json) =>
      _$DropdownRegisterModelFromJson(json);
}
