import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/bank_info/bank_info_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
part 'bank_info_response.g.dart';

@JsonSerializable()
class BankInfoResponse {
  @JsonKey(name: 'data_account_type')
  List<DropdownDataModel>? dataAccountType;
  @JsonKey(name: 'bank_info')
  List<BankInfoModel>? bankInfo;
  BankInfoResponse();
  factory BankInfoResponse.fromJson(Map<String, dynamic> json) =>
      _$BankInfoResponseFromJson(json);
}
