import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/information/water_quality_response.dart';

part 'water_quality_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class WaterQualityApiClient {
  factory WaterQualityApiClient(Dio dio, {String baseUrl}) =
      _WaterQualityApiClient;

  @GET('/v1/info/water_quality')
  Future<BaseResponse<List<WaterQualityInfoResponse>>?> fetch();

  @GET('/v1/info/water_quality')
  Future<BaseResponse<List<WaterQualityInfoResponse>>?> fetchByFarmer(
      @Query('farmer_id') int? farmerId);

  @POST('/v1/info/water_quality')
  @MultiPart()
  Future<BaseResponse?> add(@Body() data);

  @POST('/v1/info/water_quality/{id}')
  Future<BaseResponse?> update(@Path('id') String id, @Body() data);
}
