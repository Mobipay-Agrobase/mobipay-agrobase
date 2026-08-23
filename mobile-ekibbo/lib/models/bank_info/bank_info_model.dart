import 'package:json_annotation/json_annotation.dart';
part 'bank_info_model.g.dart';

@JsonSerializable()
class BankInfoModel {
  int? id;
  @JsonKey(includeToJson: false, name: 'farmer_id')
  int? farmerId;
  @JsonKey(name: 'accout_type')
  String? accoutType;
  @JsonKey(name: 'accout_no')
  String? accoutNo;
  @JsonKey(name: 'bank_name')
  String? bankName;
  @JsonKey(name: 'branch_details')
  String? branchDetails;
  @JsonKey(name: 'sort_code')
  String? sortCode;

  BankInfoModel();

  factory BankInfoModel.fromJson(Map<String, dynamic> json) =>
      _$BankInfoModelFromJson(json);

  Map<String, dynamic> toJson() => _$BankInfoModelToJson(this);
}
