// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

import 'package:json_annotation/json_annotation.dart';

part 'vehicle_type_model.g.dart';

@JsonSerializable()
class MVehicleType {
  @JsonKey(defaultValue: 0)
  final int id;
  @JsonKey(defaultValue: '')
  final String name;
  @JsonKey(defaultValue: '')
  final String code;
  @JsonKey(defaultValue: '')
  final String slug;

  MVehicleType({
    required this.id,
    required this.name,
    required this.code,
    required this.slug,
  });

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'code': code,
      'slug': slug,
    };
  }

  factory MVehicleType.fromJson(Map<String, dynamic> map) => _$MVehicleTypeFromJson(map);

  String toJson() => json.encode(toMap());
}
