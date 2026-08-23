// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'drodown_farmland_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DropdownFarmLandModel _$DropdownFarmLandModelFromJson(
        Map<String, dynamic> json) =>
    DropdownFarmLandModel()
      ..dataAppoarchRoad = (json['data_appoarch_road'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..dataLandTopolog = (json['data_land_topolog'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..dataLandGradient = (json['data_land_gradient'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..dataLandDocument = (json['data_land_document'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..dataLandWwnerShip = (json['data_land_owner_ship'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..allFarmer = (json['all_farmer'] as List<dynamic>?)
          ?.map((e) => FarmerModel.fromJson(e as Map<String, dynamic>))
          .toList();

Map<String, dynamic> _$DropdownFarmLandModelToJson(
        DropdownFarmLandModel instance) =>
    <String, dynamic>{
      'data_appoarch_road': instance.dataAppoarchRoad,
      'data_land_topolog': instance.dataLandTopolog,
      'data_land_gradient': instance.dataLandGradient,
      'data_land_document': instance.dataLandDocument,
      'data_land_owner_ship': instance.dataLandWwnerShip,
      'all_farmer': instance.allFarmer,
    };
