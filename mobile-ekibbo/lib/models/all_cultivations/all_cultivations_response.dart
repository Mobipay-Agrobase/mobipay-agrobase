import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';
part 'all_cultivations_response.g.dart';

@JsonSerializable()
class AllCutivationResponse {
  List<CultivationModel>? cultivation;
  AllCutivationResponse();
  factory AllCutivationResponse.fromJson(Map<String, dynamic> json) =>
      _$AllCutivationResponseFromJson(json);
}
