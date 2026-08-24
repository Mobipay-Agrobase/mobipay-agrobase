// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:json_annotation/json_annotation.dart';

part 'model_cooperative.g.dart';

@JsonSerializable()
class MCooperative {
  @JsonKey(defaultValue: 0)
  final int id;

  @JsonKey(name: 'staff_id', defaultValue: 0)
  final int staffId;

  /// The web `/mobile/ekibbo-geo?type=cooperatives` route returns
  /// `cooperative_name` (not `name`). Accept BOTH keys so the dropdown
  /// stops showing empty rows for every cooperative.
  @JsonKey(name: 'cooperative_name', defaultValue: '')
  final String name;

  @JsonKey(name: 'cooperative_code', defaultValue: '')
  final String cooperativeCode;

  MCooperative({
    required this.id,
    required this.staffId,
    required this.name,
    required this.cooperativeCode,
  });

  Map<String, dynamic> toMap() => _$MCooperativeToJson(this);

  factory MCooperative.fromJson(Map<String, dynamic> map) =>
      _$MCooperativeFromJson(map);
}
