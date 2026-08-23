// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'profile_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ProfileResponse _$ProfileResponseFromJson(Map<String, dynamic> json) =>
    ProfileResponse()
      ..staffData = json['staff_data'] == null
          ? null
          : ProfileModel.fromJson(json['staff_data'] as Map<String, dynamic>);

Map<String, dynamic> _$ProfileResponseToJson(ProfileResponse instance) =>
    <String, dynamic>{
      'staff_data': instance.staffData,
    };

Map<String, dynamic> _$ProfileModelToJson(ProfileModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'first_name': instance.firstName,
      'last_name': instance.lastName,
      'gender': instance.gender,
      'email': instance.email,
      'phone_number': instance.phoneNumber,
    };
