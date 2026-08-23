// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'farm_equipment_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FarmEquipmentResponse _$FarmEquipmentResponseFromJson(
        Map<String, dynamic> json) =>
    FarmEquipmentResponse()
      ..dataFarmEquipment = (json['data_farm_equipment'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..farmEquipment = (json['farm_equipment'] as List<dynamic>?)
          ?.map((e) => FarmEquipmentModel.fromJson(e as Map<String, dynamic>))
          .toList();

Map<String, dynamic> _$FarmEquipmentResponseToJson(
        FarmEquipmentResponse instance) =>
    <String, dynamic>{
      'data_farm_equipment': instance.dataFarmEquipment,
      'farm_equipment': instance.farmEquipment,
    };

FarmEquipmentModel _$FarmEquipmentModelFromJson(Map<String, dynamic> json) =>
    FarmEquipmentModel()
      ..id = json['id'] as int?
      ..farmEquipmentItems = json['farm_equipment_items'] as String?
      ..farmEquipmentItemsCount = json['farm_equipment_items_count'] as int?
      ..yearOfManufacture = json['year_of_manufacture'] as int?
      ..yearOfPurchase = json['year_of_purchase'] as int?;

Map<String, dynamic> _$FarmEquipmentModelToJson(FarmEquipmentModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'farm_equipment_items': instance.farmEquipmentItems,
      'farm_equipment_items_count': instance.farmEquipmentItemsCount,
      'year_of_manufacture': instance.yearOfManufacture,
      'year_of_purchase': instance.yearOfPurchase,
    };
