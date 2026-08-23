// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bank_info_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BankInfoResponse _$BankInfoResponseFromJson(Map<String, dynamic> json) =>
    BankInfoResponse()
      ..dataAccountType = (json['data_account_type'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..bankInfo = (json['bank_info'] as List<dynamic>?)
          ?.map((e) => BankInfoModel.fromJson(e as Map<String, dynamic>))
          .toList();

Map<String, dynamic> _$BankInfoResponseToJson(BankInfoResponse instance) =>
    <String, dynamic>{
      'data_account_type': instance.dataAccountType,
      'bank_info': instance.bankInfo,
    };
