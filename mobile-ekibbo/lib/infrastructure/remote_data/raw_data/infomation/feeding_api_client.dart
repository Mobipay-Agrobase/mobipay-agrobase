import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/information/feeding_response.dart';

part 'feeding_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class FeedingApiClient {
  factory FeedingApiClient(Dio dio, {String baseUrl}) = _FeedingApiClient;

  @GET('/v1/info/feeding')
  Future<BaseResponse<List<FeedingInfoResponse>>?> fetch();

  @GET('/v1/info/feeding')
  Future<BaseResponse<List<FeedingInfoResponse>>?> fetchByFarmer(
      @Query('farmer_id') int? farmerId);

  @POST('/v1/info/feeding')
  @MultiPart()
  Future<BaseResponse?> add(@Body() data);

  @POST('/v1/info/feeding/{id}')
  Future<BaseResponse?> update(@Path('id') String id, @Body() data);
}
