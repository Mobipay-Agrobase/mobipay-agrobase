import 'package:json_annotation/json_annotation.dart';
import 'package:agrobase_ekibbo/models/user/user_model.dart';

part 'login_model.g.dart';

@JsonSerializable()
class LoginModel {
  @JsonKey(name: 'access_token')
  String? accessToken;
  UserModel? user;
  LoginModel();
  factory LoginModel.fromJson(Map<String, dynamic> json) =>
      _$LoginModelFromJson(json);
}
