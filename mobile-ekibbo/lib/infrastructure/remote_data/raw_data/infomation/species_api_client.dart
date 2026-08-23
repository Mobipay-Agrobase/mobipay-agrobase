import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/information/species_response.dart';

part 'species_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class SpeciesApiClient {
  factory SpeciesApiClient(Dio dio, {String baseUrl}) =
      _SpeciesApiClient;

  @GET('/v1/info/species')
  Future<BaseResponse<List<SpeciesInfoResponse>>?> fetch(
      @Query('farmer_id') String? farmerId, @Query('pond_id') String? pondId);

  @POST('/v1/info/species')
  Future<BaseResponse?> add(@Body() data);

  @POST('/v1/info/species/{id}')
  Future<BaseResponse?> update(
      @Path('id') String id, @Body() data);
}