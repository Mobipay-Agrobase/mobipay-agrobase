// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'family_info_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FamilyInfoResponse _$FamilyInfoResponseFromJson(Map<String, dynamic> json) =>
    FamilyInfoResponse()
      ..dataEducation = (json['data_education'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..dataMarialStatus = (json['data_marial_status'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..familyInfo = json['family_info'] == null
          ? null
          : FamilyInfoModel.fromJson(
              json['family_info'] as Map<String, dynamic>);

Map<String, dynamic> _$FamilyInfoResponseToJson(FamilyInfoResponse instance) =>
    <String, dynamic>{
      'data_education': instance.dataEducation,
      'data_marial_status': instance.dataMarialStatus,
      'family_info': instance.familyInfo,
    };
