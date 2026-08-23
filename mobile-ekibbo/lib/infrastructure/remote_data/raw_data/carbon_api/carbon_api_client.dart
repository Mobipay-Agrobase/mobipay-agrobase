import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/carbon_emission/carbon_emission_response.dart';

part 'carbon_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class CarbonApiClient {
  factory CarbonApiClient(Dio dio, {String baseUrl}) = _CarbonApiClient;

  @POST('/carbon_emission/create')
  Future<BaseResponse?> createCarbonEmission(@Body() data);

  @GET('/carbon_emission/details/{id}')
  Future<BaseResponse<CarbonEmissionResponse>?> getDetailCarbonEmission(
      @Path('id') int id);
}
