// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'base_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BaseResponse<T> _$BaseResponseFromJson<T>(
  Map<String, dynamic> json,
  T Function(Object? json) fromJsonT,
) =>
    BaseResponse<T>(
      statusCode: json['statusCode'] as int?,
      data: _$nullableGenericFromJson(json['data'], fromJsonT),
      status: json['status'] as String?,
      message: json['message'],
      messageKey: json['messageKey'] as String?,
      result: json['result'] as bool?,
      access_token: json['access_token'] as String?,
      errors: json['errors'],
    );

Map<String, dynamic> _$BaseResponseToJson<T>(
  BaseResponse<T> instance,
  Object? Function(T value) toJsonT,
) =>
    <String, dynamic>{
      'data': _$nullableGenericToJson(instance.data, toJsonT),
      'status': instance.status,
      'message': instance.message,
      'statusCode': instance.statusCode,
      'messageKey': instance.messageKey,
      'result': instance.result,
      'access_token': instance.access_token,
      'errors': instance.errors,
    };

T? _$nullableGenericFromJson<T>(
  Object? input,
  T Function(Object? json) fromJson,
) =>
    input == null ? null : fromJson(input);

Object? _$nullableGenericToJson<T>(
  T? input,
  Object? Function(T value) toJson,
) =>
    input == null ? null : toJson(input);

BaseListResponse<T> _$BaseListResponseFromJson<T>(
  Map<String, dynamic> json,
  T Function(Object? json) fromJsonT,
) =>
    BaseListResponse<T>(
      data: _$nullableGenericFromJson(json['data'], fromJsonT),
      status: json['status'] as String?,
      statusCode: json['statusCode'] as int?,
      message: json['message'] as String?,
      result: json['result'] as bool?,
    );

Map<String, dynamic> _$BaseListResponseToJson<T>(
  BaseListResponse<T> instance,
  Object? Function(T value) toJsonT,
) =>
    <String, dynamic>{
      'data': _$nullableGenericToJson(instance.data, toJsonT),
      'status': instance.status,
      'statusCode': instance.statusCode,
      'message': instance.message,
      'result': instance.result,
    };
