// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'certificate_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CertificateResponse _$CertificateResponseFromJson(Map<String, dynamic> json) =>
    CertificateResponse()
      ..certificateInfo = json['certificate_info'] == null
          ? null
          : CertificateModel.fromJson(
              json['certificate_info'] as Map<String, dynamic>);

Map<String, dynamic> _$CertificateResponseToJson(
        CertificateResponse instance) =>
    <String, dynamic>{
      'certificate_info': instance.certificateInfo,
    };

CertificateModel _$CertificateModelFromJson(Map<String, dynamic> json) =>
    CertificateModel()
      ..isCertifiedFarmer = json['is_certified_farmer'] as String?
      ..certificationType = json['certification_type'] as String?
      ..yearOfIcs = json['year_of_ics'] as String?;

Map<String, dynamic> _$CertificateModelToJson(CertificateModel instance) =>
    <String, dynamic>{
      'is_certified_farmer': instance.isCertifiedFarmer,
      'certification_type': instance.certificationType,
      'year_of_ics': instance.yearOfIcs,
    };
