// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'warehouse_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MWareHouse _$MWareHouseFromJson(Map<String, dynamic> json) => MWareHouse(
      id: json['id'] as int? ?? 0,
      staffId: json['staffId'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      code: json['code'] as String? ?? '',
      type: json['type'] as String? ?? '',
      address: json['address'] as String? ?? '',
    );

Map<String, dynamic> _$MWareHouseToJson(MWareHouse instance) =>
    <String, dynamic>{
      'id': instance.id,
      'staffId': instance.staffId,
      'name': instance.name,
      'code': instance.code,
      'type': instance.type,
      'address': instance.address,
    };
