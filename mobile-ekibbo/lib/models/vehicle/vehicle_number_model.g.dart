// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'vehicle_number_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MVehicleNumber _$MVehicleNumberFromJson(Map<String, dynamic> json) =>
    MVehicleNumber(
      id: json['id'] as int? ?? 0,
      typeId: json['type_id'] as int? ?? 0,
      driverName: json['driver_name'] as String? ?? '',
      licenseNumber: json['license_number'] as String? ?? '',
      driverPhoneNumber: json['driver_phone_number'] as String? ?? '',
    );

Map<String, dynamic> _$MVehicleNumberToJson(MVehicleNumber instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type_id': instance.typeId,
      'driver_name': instance.driverName,
      'license_number': instance.licenseNumber,
      'driver_phone_number': instance.driverPhoneNumber,
    };
