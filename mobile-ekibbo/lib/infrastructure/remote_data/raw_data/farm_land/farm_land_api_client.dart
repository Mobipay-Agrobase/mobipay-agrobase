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

  @POST('/add_farmland')
  @MultiPart()
  Future<BaseResponse?> addFarmLand(@Body() FormData data);

  @POST('/farmland/update_farmland/{farmId}')
  @MultiPart()
  Future<BaseResponse?> updateFarmland(
      @Body() FormData data, @Path('farmId') int farmId);

  @GET('/farmland/dropdown_value') //remove list all_farmer
  Future<BaseResponse<DropdownFarmLandModel>?> getFarmLandDropdownData();
  @GET('/get_all_farm_land/{farmerId}')
  Future<BaseResponse<AllFarmLandResponse>?> getAllFarmLands(
      @Path('farmerId') int farmerId);
  @GET('/get_all_farm_land_by_staff')
  Future<BaseResponse<AllFarmLandResponse>?> getNearByPlot();
  @GET('/farmland/get_details/{farmId}')
  Future<BaseResponse<FarmlandDetailResponse>?> getDetailFarmland(
      @Path('farmId') int farmId);
  @GET('/farmland/get_cultivation/{farmId}')
  Future<BaseResponse<AllCutivationResponse>?> getCultivations(
      @Path('farmId') int farmId);
  @GET(
      '/cultivations?farm_land_id={farmlandId}&season_id={seasonId}&crop_id={cropId}&whereDoesntHave=cropHarvestDetail')
  Future<BaseResponse<List<CultivationModel>>?> findCultivations(
      @Path('farmlandId') int farmlandId,
      @Path('seasonId') int seasonId,
      @Path('cropId') int cropId);
}
