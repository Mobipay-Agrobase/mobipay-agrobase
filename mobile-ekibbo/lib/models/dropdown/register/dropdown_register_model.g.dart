// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dropdown_register_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DropdownRegisterModel _$DropdownRegisterModelFromJson(
        Map<String, dynamic> json) =>
    DropdownRegisterModel()
      ..dataIdentityProof = (json['data_identity_proof'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..dataEnrollmentPlace = (json['data_enrollment_place'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..dataGender = (json['data_gender'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList();

Map<String, dynamic> _$DropdownRegisterModelToJson(
        DropdownRegisterModel instance) =>
    <String, dynamic>{
      'data_identity_proof': instance.dataIdentityProof,
      'data_enrollment_place': instance.dataEnrollmentPlace,
      'data_gender': instance.dataGender,
    };
