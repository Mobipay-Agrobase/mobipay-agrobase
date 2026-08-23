import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/login/login_model.dart';
import 'package:agrobase_ekibbo/models/login/profile_response.dart';

part 'auth_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class AuthApiClient {
  factory AuthApiClient(Dio dio, {String baseUrl}) = _AuthApiClient;
  @POST('/auth/login')
  Future<BaseResponse<LoginModel>?> login(@Body() data);

  @GET('/staff_details')
  Future<BaseResponse<ProfileResponse>?> getProfile();
}
