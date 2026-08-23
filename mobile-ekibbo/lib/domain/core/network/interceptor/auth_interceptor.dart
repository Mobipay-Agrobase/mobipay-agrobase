import 'package:dio/dio.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

class AuthInterceptor extends InterceptorsWrapper {
  Dio dio;
  bool isUser;
  AuthInterceptor(this.dio, {this.isUser = true});
  @override
  void onRequest(
      RequestOptions options, RequestInterceptorHandler handler) async {
    String token = isUser
        ? SharedPreferencesProvider.instance.accessToken
        : SharedPreferencesProvider.instance.sellerToken;
    if (token.isNotEmpty) {
      options.headers['Authorization'] = "Bearer $token";
    }
    super.onRequest(options, handler);
  }
}
