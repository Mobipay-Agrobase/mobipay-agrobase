// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

import 'package:json_annotation/json_annotation.dart';

part 'vehicle_number_model.g.dart';

@JsonSerializable()
class MVehicleNumber {
  @JsonKey(defaultValue: 0)
  final int id;
  @JsonKey(name: "type_id", defaultValue: 0)
  final int typeId;
  @JsonKey(name: "driver_name", defaultValue: '')
  final String driverName;
  @JsonKey(name: "license_number", defaultValue: '')
  final String licenseNumber;
  @JsonKey(name: "driver_phone_number", defaultValue: '')
  final String driverPhoneNumber;

  MVehicleNumber({
    required this.id,
    required this.typeId,
    required this.driverName,
    required this.licenseNumber,
    required this.driverPhoneNumber,
  });

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'typeId': typeId,
      'driverName': driverName,
      'licenseNumber': licenseNumber,
      'driverPhoneNumber': driverPhoneNumber,
    };
  }

  factory MVehicleNumber.fromJson(Map<String, dynamic> map) => _$MVehicleNumberFromJson(map);

  String toJson() => json.encode(toMap());
}
