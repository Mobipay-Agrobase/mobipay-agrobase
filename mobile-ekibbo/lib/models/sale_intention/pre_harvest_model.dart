// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:json_annotation/json_annotation.dart';

part 'pre_harvest_model.g.dart';

@JsonSerializable()
class MPreHarvestQC {
  @JsonKey(defaultValue: 0)
  int id;
  @JsonKey(defaultValue: 0)
  int min_standard;
  @JsonKey(defaultValue: 0)
  int max_standard;
  @JsonKey(defaultValue: '')
  String description;
  @JsonKey(defaultValue: '')
  String unit;
  @JsonKey(defaultValue: '')
  String value;
  @JsonKey(defaultValue: 0)
  int type; //1 => number, 0 => String
  @JsonKey(defaultValue: '', name: 'description_vn')
  String descriptionVi;
  @JsonKey(defaultValue: '', name: 'description_en')
  String descriptionEn;

  MPreHarvestQC({
    required this.id,
    required this.min_standard,
    required this.max_standard,
    required this.description,
    required this.unit,
    required this.value,
    required this.type,
    required this.descriptionEn,
    required this.descriptionVi,
  });

  Map<String, dynamic> toMap() => _$MPreHarvestQCToJson(this);

  String getDescription(String lang) {
    switch (lang) {
      case 'vi':
        return descriptionVi;
      case 'en':
        return descriptionEn;
      default:
        return '';
    }
  }

  factory MPreHarvestQC.fromJson(Map<String, dynamic> map) =>
      _$MPreHarvestQCFromJson(map);
}
