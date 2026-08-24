import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/all_cultivations/all_cultivations_response.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/farm_land/drodown_farmland_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/all_farm_land_response.dart';
import 'package:agrobase_ekibbo/models/farmland_detail/farmland_detail_response.dart';

part 'farm_land_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class FarmLandApiClient {
  factory FarmLandApiClient(Dio dio, {String baseUrl}) = _FarmLandApiClient;

  @POST('/mobile/ekibbo-farmland')
  @MultiPart()
  Future<BaseResponse?> addFarmLand(@Body() FormData data);

  @PUT('/mobile/ekibbo-farmland/{farmId}')
  @MultiPart()
  Future<BaseResponse?> updateFarmland(
      @Body() FormData data, @Path('farmId') int farmId);

  @GET('/mobile/ekibbo-farmland') //remove list all_farmer
  Future<BaseResponse<DropdownFarmLandModel>?> getFarmLandDropdownData();
  @GET('/mobile/ekibbo-farmlands/{farmerId}')
  Future<BaseResponse<AllFarmLandResponse>?> getAllFarmLands(
      @Path('farmerId') int farmerId);
  @GET('/mobile/ekibbo-farmlands')
  Future<BaseResponse<AllFarmLandResponse>?> getNearByPlot();
  @GET('/mobile/ekibbo-farmland/{farmId}')
  Future<BaseResponse<FarmlandDetailResponse>?> getDetailFarmland(
      @Path('farmId') int farmId);
  @GET('/mobile/ekibbo-cultivation/{farmId}')
  Future<BaseResponse<AllCutivationResponse>?> getCultivations(
      @Path('farmId') int farmId);
  @GET(
      '/cultivations?farm_land_id={farmlandId}&season_id={seasonId}&crop_id={cropId}&whereDoesntHave=cropHarvestDetail')
  Future<BaseResponse<List<CultivationModel>>?> findCultivations(
      @Path('farmlandId') int farmlandId,
      @Path('seasonId') int seasonId,
      @Path('cropId') int cropId);
}
