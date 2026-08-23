import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/stock/transfer_response.dart';
part 'transfer_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class StockTransferApiClient {
  factory StockTransferApiClient(Dio dio, {String baseUrl}) =
      _StockTransferApiClient;

  @GET('/v1/stock/transfer')
  Future<BaseResponse<List<StockTransferResponse>>?> fetch();

  @POST('/v1/stock/transfer')
  @MultiPart()
  Future<BaseResponse?> add(@Body() data);

  @POST('/v1/stock/transfer/{id}')
  Future<BaseResponse?> update(@Path('id') String id, @Body() data);
}
