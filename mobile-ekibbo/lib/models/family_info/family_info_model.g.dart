// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'family_info_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FamilyInfoModel _$FamilyInfoModelFromJson(Map<String, dynamic> json) =>
    FamilyInfoModel()
      ..id = json['id'] as int?
      ..farmerId = json['farmer_id'] as int?
      ..marialStatus = json['marial_status'] as String?
      ..parentName = json['parent_name'] as String?
      ..spouseName = json['spouse_name'] as String?
      ..noOfFamily = json['no_of_family'] as String?
      ..totalGoingSchool = json['total_child_under_18_going_school'] as String?
      ..totalChild = json['total_child_under_18'] == null
          ? null
          : NumChildModel.fromJson(
              json['total_child_under_18'] as Map<String, dynamic>)
      ..education = json['education'] as String?;

Map<String, dynamic> _$FamilyInfoModelToJson(FamilyInfoModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'farmer_id': instance.farmerId,
      'marial_status': instance.marialStatus,
      'parent_name': instance.parentName,
      'spouse_name': instance.spouseName,
      'no_of_family': instance.noOfFamily,
      'total_child_under_18_going_school': instance.totalGoingSchool,
      'total_child_under_18': instance.totalChild,
      'education': instance.education,
    };

NumChildModel _$NumChildModelFromJson(Map<String, dynamic> json) =>
    NumChildModel()
      ..male = json['male'] as String?
      ..female = json['female'] as String?;

Map<String, dynamic> _$NumChildModelToJson(NumChildModel instance) =>
    <String, dynamic>{
      'male': instance.male,
      'female': instance.female,
    };
