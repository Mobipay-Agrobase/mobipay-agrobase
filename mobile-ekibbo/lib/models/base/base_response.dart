// ignore_for_file: non_constant_identifier_names

import 'package:json_annotation/json_annotation.dart';

part 'base_response.g.dart';

@JsonSerializable(genericArgumentFactories: true)
class BaseResponse<T> {
  T? data;
  String? status;
  dynamic message;
  int? statusCode;
  String? messageKey;
  bool? result;
  String? access_token;
  dynamic errors;

  BaseResponse({
    this.statusCode,
    this.data,
    this.status,
    this.message,
    this.messageKey,
    this.result,
    this.access_token,
    this.errors,
  });

  factory BaseResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json) fromJsonT,
  ) =>
      _$BaseResponseFromJson(json, fromJsonT);

  Map<String, dynamic> toJson(Object Function(T value) toJsonT) =>
      _$BaseResponseToJson(this, toJsonT);
}

@JsonSerializable(genericArgumentFactories: true)
class BaseListResponse<T> {
  T? data;
  String? status;
  int? statusCode;
  String? message;
  bool? result;
  BaseListResponse({
    this.data,
    this.status,
    this.statusCode,
    this.message,
    this.result,
  });

  factory BaseListResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json) fromJsonT,
  ) =>
      _$BaseListResponseFromJson(json, fromJsonT);

  Map<String, dynamic> toJson(Object Function(T value) toJsonT) =>
      _$BaseListResponseToJson(this, toJsonT);
}
