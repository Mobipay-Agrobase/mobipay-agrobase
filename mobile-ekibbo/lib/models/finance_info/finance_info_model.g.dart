// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'finance_info_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FinanceInfoModel _$FinanceInfoModelFromJson(Map<String, dynamic> json) =>
    FinanceInfoModel()
      ..id = json['id'] as int?
      ..loanTakenLastYear = json['loan_taken_last_year'] as String?
      ..loanTakenFrom = json['loan_taken_from'] as String?
      ..loanAmount = (json['loan_amount'] as num?)?.toDouble()
      ..loanInterest = (json['loan_interest'] as num?)?.toDouble()
      ..purpose = json['purpose'] as String?
      ..interestPeriod = json['interestPeriod'] as String?
      ..security = json['security'] as String?
      ..loanRepaymentAmount =
          (json['loan_repayment_amount'] as num?)?.toDouble()
      ..loanRepaymentDate = json['loan_repayment_date'] as String?;

Map<String, dynamic> _$FinanceInfoModelToJson(FinanceInfoModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'loan_taken_last_year': instance.loanTakenLastYear,
      'loan_taken_from': instance.loanTakenFrom,
      'loan_amount': instance.loanAmount,
      'loan_interest': instance.loanInterest,
      'purpose': instance.purpose,
      'interestPeriod': instance.interestPeriod,
      'security': instance.security,
      'loan_repayment_amount': instance.loanRepaymentAmount,
      'loan_repayment_date': instance.loanRepaymentDate,
    };
