import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/farm_plant/farm_plant_model.dart';

part 'farm_plant_api_client.g.dart';

/// Second review (H): per-farm plant inventory (Coffee/Cocoa/Vanilla/
/// Shade Trees/Bananas/Jackfruit/Avocado/Cassava + variety + count) —
/// the data source for the Farm Land Registry "Total Plants" KPI.
@RestApi(baseUrl: '')
abstract class FarmPlantApiClient {
  factory FarmPlantApiClient(Dio dio, {String baseUrl}) = _FarmPlantApiClient;

  /// Plant rows for one farm. `farmLandId` is the numeric id the mobile
  /// app uses (server resolves it back to the real farm record).
  @GET('/mobile/ekibbo-farm-plants')
  Future<BaseResponse<List<FarmPlantModel>>?> getFarmPlants(
      @Query('farm_land_id') int farmLandId);

  @POST('/mobile/ekibbo-farm-plants')
  Future<BaseResponse?> addFarmPlant(@Body() Map<String, dynamic> data);

  @DELETE('/mobile/ekibbo-farm-plants')
  Future<BaseResponse?> deleteFarmPlant(@Query('id') int plantId);
}
