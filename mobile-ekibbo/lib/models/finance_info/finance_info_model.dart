import 'package:json_annotation/json_annotation.dart';
part 'finance_info_model.g.dart';

@JsonSerializable()
class FinanceInfoModel {
  int? id;
  @JsonKey(name: 'loan_taken_last_year')
  String? loanTakenLastYear;
  @JsonKey(name: 'loan_taken_from')
  String? loanTakenFrom;
  @JsonKey(name: 'loan_amount')
  double? loanAmount;
  @JsonKey(name: 'loan_interest')
  double? loanInterest;
  String? purpose;
  @JsonKey(name: 'interestPeriod')
  String? interestPeriod;
  String? security;
  @JsonKey(name: 'loan_repayment_amount')
  double? loanRepaymentAmount;
  @JsonKey(name: 'loan_repayment_date')
  String? loanRepaymentDate;
  FinanceInfoModel();

  factory FinanceInfoModel.fromJson(Map<String, dynamic> json) =>
      _$FinanceInfoModelFromJson(json);
  Map<String, dynamic> toJson() => _$FinanceInfoModelToJson(this);
}
