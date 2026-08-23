// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'finance_info_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FinanceInfoResponse _$FinanceInfoResponseFromJson(Map<String, dynamic> json) =>
    FinanceInfoResponse()
      ..dataPurpose = (json['data_purpose'] as List<dynamic>?)
          ?.map((e) => DropdownDataModel.fromJson(e as Map<String, dynamic>))
          .toList()
      ..financeInfo = json['finance_info'] == null
          ? null
          : FinanceInfoModel.fromJson(
              json['finance_info'] as Map<String, dynamic>);

Map<String, dynamic> _$FinanceInfoResponseToJson(
        FinanceInfoResponse instance) =>
    <String, dynamic>{
      'data_purpose': instance.dataPurpose,
      'finance_info': instance.financeInfo,
    };
