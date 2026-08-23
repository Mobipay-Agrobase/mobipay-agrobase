// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:json_annotation/json_annotation.dart';

part 'model_category.g.dart';

@JsonSerializable()
class MCategory {
  @JsonKey(defaultValue: 0)
  final int id;

  @JsonKey(defaultValue: '')
  final String name;

  MCategory({
    required this.id,
    required this.name,
  });

  Map<String, dynamic> toMap() => _$MCategoryToJson(this);

  factory MCategory.fromJson(Map<String, dynamic> map) => _$MCategoryFromJson(map);
}
