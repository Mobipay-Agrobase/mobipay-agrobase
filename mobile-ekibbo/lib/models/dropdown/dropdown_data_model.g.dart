// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dropdown_data_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DropdownDataModel _$DropdownDataModelFromJson(Map<String, dynamic> json) =>
    DropdownDataModel()
      ..id = json['ID'] as int?
      ..name = json['NAME'] as String?;

Map<String, dynamic> _$DropdownDataModelToJson(DropdownDataModel instance) =>
    <String, dynamic>{
      'ID': instance.id,
      'NAME': instance.name,
    };

DropdownMasterModel _$DropdownMasterModelFromJson(Map<String, dynamic> json) =>
    DropdownMasterModel()
      ..id = json['id'] as int?
      ..name = json['name'] as String?;

Map<String, dynamic> _$DropdownMasterModelToJson(
        DropdownMasterModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
    };
