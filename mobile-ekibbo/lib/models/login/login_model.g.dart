// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'login_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

LoginModel _$LoginModelFromJson(Map<String, dynamic> json) => LoginModel()
  ..accessToken = json['access_token'] as String?
  ..user = json['user'] == null
      ? null
      : UserModel.fromJson(json['user'] as Map<String, dynamic>);

Map<String, dynamic> _$LoginModelToJson(LoginModel instance) =>
    <String, dynamic>{
      'access_token': instance.accessToken,
      'user': instance.user,
    };
