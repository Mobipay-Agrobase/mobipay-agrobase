import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/finance_info/finance_info_model.dart';

part 'finance_info_response.g.dart';

@JsonSerializable()
class FinanceInfoResponse {
  @JsonKey(name: 'data_purpose')
  List<DropdownDataModel>? dataPurpose;
  @JsonKey(name: 'finance_info')
  FinanceInfoModel? financeInfo;
  FinanceInfoResponse();
  factory FinanceInfoResponse.fromJson(Map<String, dynamic> json) =>
      _$FinanceInfoResponseFromJson(json);
}
