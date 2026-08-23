import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:agrobase_ekibbo/domain/core/network/interceptor/logger_interceptor.dart';

class DioClient {
  late final Dio dio;
  final String baseUrl;
  DioClient({
    required this.baseUrl,
  }) {
    final BaseOptions options = BaseOptions(
      responseType: ResponseType.json,
      connectTimeout: const Duration(seconds: 8),
      receiveTimeout: const Duration(seconds: 8),
      validateStatus: (status) {
        return true;
      },
      baseUrl: baseUrl,
    );
    dio = Dio(options);
    if (kDebugMode) {
      dio.interceptors.add(LoggerInterceptor());
    }
  }
}
