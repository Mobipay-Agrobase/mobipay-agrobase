import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/information/mortality_response.dart';

part 'mortalities_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class MortalityApiClient {
  factory MortalityApiClient(Dio dio, {String baseUrl}) = _MortalityApiClient;

  @GET('/v1/info/mortality')
  Future<BaseResponse<List<MortalitiesInfoResponse>>?> fetch();

  @GET('/v1/info/mortality')
  Future<BaseResponse<List<MortalitiesInfoResponse>>?> fetchByFarmer(
      @Query('farmer_id') int? farmerId);

  @POST('/v1/info/mortality')
  @MultiPart()
  Future<BaseResponse?> add(@Body() data);

  @POST('/v1/info/mortality/{id}')
  Future<BaseResponse?> update(@Path('id') String id, @Body() data);
}
