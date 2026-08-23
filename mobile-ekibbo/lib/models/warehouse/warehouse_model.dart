// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

import 'package:json_annotation/json_annotation.dart';

part 'warehouse_model.g.dart';

@JsonSerializable()
class MWareHouse {
  @JsonKey(defaultValue: 0)
  final int id;

  @JsonKey(defaultValue: 0)
  final int staffId;

  @JsonKey(defaultValue: '')
  final String name;

  @JsonKey(defaultValue: '')
  final String code;
  //final double capacity;

  @JsonKey(defaultValue: '')
  final String type;
  //final double lat;
  //final double lng;
  @JsonKey(defaultValue: '')
  final String address;

  MWareHouse({
    required this.id,
    required this.staffId,
    required this.name,
    required this.code,
    required this.type,
    required this.address,
  });

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'staffId': staffId,
      'name': name,
      'code': code,
      'type': type,
      'address': address,
    };
  }

  factory MWareHouse.fromJson(Map<String, dynamic> map) =>
      _$MWareHouseFromJson(map);

  String toJson() => json.encode(toMap());
}
