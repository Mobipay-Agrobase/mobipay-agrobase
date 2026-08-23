import 'package:json_annotation/json_annotation.dart';
part 'certificate_response.g.dart';

@JsonSerializable()
class CertificateResponse {
  @JsonKey(name: 'certificate_info')
  CertificateModel? certificateInfo;
  CertificateResponse();
  factory CertificateResponse.fromJson(Map<String, dynamic> json) =>
      _$CertificateResponseFromJson(json);
}

@JsonSerializable()
class CertificateModel {
  @JsonKey(name: 'is_certified_farmer')
  String? isCertifiedFarmer;
  @JsonKey(name: 'certification_type')
  String? certificationType;
  @JsonKey(name: 'year_of_ics')
  String? yearOfIcs;
  CertificateModel();
  factory CertificateModel.fromJson(Map<String, dynamic> json) =>
      _$CertificateModelFromJson(json);
}
