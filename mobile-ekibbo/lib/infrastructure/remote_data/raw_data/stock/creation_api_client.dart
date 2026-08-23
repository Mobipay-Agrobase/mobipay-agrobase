import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/stock/creation_response.dart';

part 'creation_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class StockCreationApiClient {
  factory StockCreationApiClient(Dio dio, {String baseUrl}) =
      _StockCreationApiClient;

  @GET('/v1/stock/creation')
  Future<BaseResponse<List<StockCreationResponse>>?> fetch();

  @POST('/v1/stock/creation')
  @MultiPart()
  Future<BaseResponse?> add(@Body() data);

  @POST('/v1/stock/creation/{id}')
  Future<BaseResponse?> update(
      @Path('id') String id, @Body() data);
}
