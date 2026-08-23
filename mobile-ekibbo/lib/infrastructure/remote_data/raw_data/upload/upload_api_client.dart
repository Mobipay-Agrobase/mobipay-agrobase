import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';

part 'upload_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class UploadApiClient {
  factory UploadApiClient(Dio dio, {String baseUrl}) = _UploadApiClient;

  @POST('/v1/upload')
  Future<BaseResponse?> upload(@Body() FormData data);
}