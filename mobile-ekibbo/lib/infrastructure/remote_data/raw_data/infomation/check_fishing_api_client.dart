import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/information/check_fishing_response.dart';

part 'check_fishing_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class CheckFishingApiClient {
  factory CheckFishingApiClient(Dio dio, {String baseUrl}) =
      _CheckFishingApiClient;

  @GET('/v1/info/check_fishing')
  Future<BaseResponse<List<CheckFishingResponse>>?> fetch();

  @GET('/v1/info/check_fishing')
  Future<BaseResponse<List<CheckFishingResponse>>?> fetchByFarmer(
      @Query('farmer_id') int? farmerId);

  @POST('/v1/info/check_fishing')
  @MultiPart()
  Future<BaseResponse?> add(@Body() data);

  @POST('/v1/info/check_fishing/{id}')
  Future<BaseResponse?> update(@Path('id') String id, @Body() data);
}
