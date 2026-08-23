import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

String prettyJsonStr(Map<dynamic, dynamic> json) {
  final encoder = JsonEncoder.withIndent('  ', (data) => data.toString());
  return encoder.convert(json);
}

class LoggerInterceptor extends Interceptor {
  final Function(DioException)? onRequestError;
  //For case response data is too large, dont need to show on log
  final bool Function(Response)? ignoreResponseDataLog;

  LoggerInterceptor({
    this.onRequestError,
    this.ignoreResponseDataLog,
  });

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // debugPrint(prettyJsonStr({
    //   'from': 'onRequest',
    //   'Time': DateTime.now().toString(),
    //   'baseUrl': options.baseUrl,
    //   'path': options.path,
    //   'headers': options.headers,
    //   'method': options.method,
    //   'requestData': options.data,
    //   'queryParameters': options.queryParameters,
    // }));
    super.onRequest(options, handler);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    debugPrint(prettyJsonStr({
      'from': 'onResponse',
      'Time': DateTime.now().toString(),
      'statusCode': response.statusCode,
      'baseUrl': response.requestOptions.baseUrl,
      'path': response.requestOptions.path,
      'method': response.requestOptions.method,
      'queryParameters': response.requestOptions.queryParameters,
      'headers': response.requestOptions.headers,
      if (ignoreResponseDataLog?.call(response) != false)
        if (response.requestOptions.path == "/farmer/registration")
          'responseData': response.data,
    }));

    super.onResponse(response, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    debugPrint(prettyJsonStr({
      'from': 'onError',
      'Time': DateTime.now().toString(),
      'baseUrl': err.requestOptions.baseUrl,
      'header': err.requestOptions.headers,
      'path': err.requestOptions.path,
      'type': err.type,
      'message': err.message,
      'statusCode': err.response?.statusCode,
      'error': err.error,
      'responseData': err.requestOptions.data
    }));
    super.onError(err, handler);
  }
}

class LoggerInterceptorHttp {
  final http.Response response;
  final bool isDebug = true;
  LoggerInterceptorHttp(this.response) {
    if (isDebug) onRequest();
  }

  void onRequest() {
    debugPrint(prettyJsonStr({
      'from': 'onRequest',
      'Time': DateTime.now().millisecondsSinceEpoch,
      'statusCode': response.statusCode,
      'baseUrl': response.request?.url,
      'method': response.request?.method,
      'headers': response.request?.headers,
      'params': response.request?.url.queryParameters,
      //'response_data': prettyJsonStr(jsonDecode(response.body)),
    }));
  }
}
