import 'package:json_annotation/json_annotation.dart';
part 'srp_result_response.g.dart';

@JsonSerializable()
class SRPResultModel {
  String? question;
  String? answer;
  int? score;
  String? title;
  String? type;
  SRPResultModel();
  factory SRPResultModel.fromJson(Map<String, dynamic> json) =>
      _$SRPResultModelFromJson(json);
}
