import 'package:json_annotation/json_annotation.dart';
part 'country_model.g.dart';

@JsonSerializable()
class CountryModel {
  int? id;
  @JsonKey(name: 'country_name')
  String? countryName;
  @JsonKey(name: 'country_code')
  String? countryCode;

  CountryModel();
  factory CountryModel.fromJson(Map<String, dynamic> json) =>
      _$CountryModelFromJson(json);

  toMap() => _$CountryModelToJson(this);
}
