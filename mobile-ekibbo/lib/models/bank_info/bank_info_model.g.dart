// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bank_info_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BankInfoModel _$BankInfoModelFromJson(Map<String, dynamic> json) =>
    BankInfoModel()
      ..id = json['id'] as int?
      ..farmerId = json['farmer_id'] as int?
      ..accoutType = json['accout_type'] as String?
      ..accoutNo = json['accout_no'] as String?
      ..bankName = json['bank_name'] as String?
      ..branchDetails = json['branch_details'] as String?
      ..sortCode = json['sort_code'] as String?;

Map<String, dynamic> _$BankInfoModelToJson(BankInfoModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'accout_type': instance.accoutType,
      'accout_no': instance.accoutNo,
      'bank_name': instance.bankName,
      'branch_details': instance.branchDetails,
      'sort_code': instance.sortCode,
    };
