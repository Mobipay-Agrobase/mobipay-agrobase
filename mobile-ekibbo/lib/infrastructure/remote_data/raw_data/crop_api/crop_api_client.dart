import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/cultivation/crop_response.dart';
import 'package:agrobase_ekibbo/models/dropdown/crop/crop_variety_response.dart';
import 'package:agrobase_ekibbo/models/dropdown/crop/dropdown_crop_model.dart';

part 'crop_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class CropApiClient {
  factory CropApiClient(Dio dio, {String baseUrl}) = _CropApiClient;
  @GET('/mobile/ekibbo-crop-dropdowns')
  Future<BaseResponse<DropdownCropModel>?> getCropDropdownData();

  /// Seasons + Crops (CropMaster) + Crop Varieties (CropVariety, with
  /// crop_id for dependent filtering) + the farmer's farm lands — all from
  /// the WEB masters in a single call.
  @GET('/mobile/ekibbo-cultivation-dropdowns')
  Future<BaseResponse<DropdownCropModel>?> getCultivationDropdowns();

  @POST('/add_crops')
  @MultiPart()
  Future<BaseResponse?> addCrop(@Body() FormData data);

  @POST('/crops/update_crops/{cropId}')
  @MultiPart()
  Future<BaseResponse?> updateCrop(
    @Body() FormData data,
    @Path('cropId') int cropId,
  );

  @GET('/crops_details/{id}')
  Future<BaseResponse<CropResponse>?> getCrop(@Path('id') int id);

  @GET('/crops/get_crop_variety/{id}')
  Future<BaseResponse<CropVarietyResponse>?> getVariety(@Path('id') int id);

  @GET('/mobile/ekibbo-crop-dropdowns?farmerId={farmlandId}&season_id={seasonId}')
  Future<BaseResponse<DropdownCropModel>?> getCropCutivated(
      @Path('farmlandId') int farmlandId, @Path('seasonId') int seasonId);
}
