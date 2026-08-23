import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/master/catalogue_response.dart';

part 'catalogue_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class CatalogueApiClient {
  factory CatalogueApiClient(Dio dio, {String baseUrl}) =
      _CatalogueApiClient;

  @GET('/v1/master/catalogues')
  Future<BaseResponse<List<CatalogueValueResponse>>?> fetch();
}