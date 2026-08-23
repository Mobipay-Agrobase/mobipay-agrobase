import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/srp/srp_result_response.dart';
import 'package:agrobase_ekibbo/models/srp/srp_schedule_response.dart';
import 'package:agrobase_ekibbo/models/srp/upload_image_response.dart';
part 'srp_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class SRPApiClient {
  factory SRPApiClient(Dio dio, {String baseUrl}) = _SRPApiClient;

  /// Get Schedule
  @GET('/srp/get-schedule?start_date={startDate}&end_date={endDate}')
  Future<BaseResponse<List<SrpScheduleModel>>?> getSchedule(
    @Path('startDate') String startDate,
    @Path('endDate') String endDate,
  );

  @GET('/srp/get-today?today={day}')
  Future<BaseResponse<List<SRPActionModel>>?> getSRPDate(
      @Path('day') String day);

  @GET(
      '/srp/by-farmer?farmer_id={farmerId}&cultivation_id={cultivationId}&season_id={seasonId}')
  Future<BaseResponse<List<SRPActionModel>>?> getSRPByFarmer(
    @Path('farmerId') int farmerId,
    @Path('cultivationId') int cultivationId,
    @Path('seasonId') int seasonId,
  );

  /// Training
  @POST('/srp/srp-training')
  Future<BaseResponse?> submitTrainingForm(@Body() data);

  @GET('/srp/srp-training?date_action={dateAction}&srp_id={srpId}')
  Future<BaseResponse<List<SRPResultModel>>?> getTrainingForm(
    @Path('dateAction') String dateAction,
    @Path('srpId') int srpId,
  );

  /// Water management
  @POST('/srp/srp-water-management')
  Future<BaseResponse?> submitWaterManagementForm(@Body() data);

  @GET('/srp/srp-water-management?date_action={dateAction}&srp_id={srpId}')
  Future<BaseResponse<List<SRPResultModel>>?> getWaterManagementForm(
    @Path('dateAction') String dateAction,
    @Path('srpId') int srpId,
  );

  /// Srp nutrient management
  @POST('/srp/srp-nutrient_management')
  Future<BaseResponse?> submitNutrientManagementForm(@Body() data);

  @GET('/srp/srp-nutrient_management?date_action={dateAction}&srp_id={srpId}')
  Future<BaseResponse<List<SRPResultModel>>?> getNutrientManagementForm(
    @Path('dateAction') String dateAction,
    @Path('srpId') int srpId,
  );

  /// Srp Integrate Pest management
  @POST('/srp/srp-integrate_pest_management')
  Future<BaseResponse?> submitIntegratePestManagementForm(@Body() data);

  @GET(
      '/srp/srp-integrate_pest_management?date_action={dateAction}&srp_id={srpId}')
  Future<BaseResponse<List<SRPResultModel>>?> getIntegratePestManagementForm(
    @Path('dateAction') String dateAction,
    @Path('srpId') int srpId,
  );

  /// Srp upload image
  @POST('/srp/srp-upload-image')
  @MultiPart()
  Future<BaseResponse<UploadImageResponse>?> uploadImage(@Body() FormData data);

  /// Srp pre planting
  @POST('/srp/srp-pre-planting')
  Future<BaseResponse?> submitPrePlantingForm(@Body() data);

  @GET('/srp/srp-pre-planting?date_action={dateAction}&srp_id={srpId}')
  Future<BaseResponse<List<SRPResultModel>>?> getPrePlantingForm(
    @Path('dateAction') String dateAction,
    @Path('srpId') int srpId,
  );

  /// Srp land preparation
  @POST('/srp/srp-land-preparation')
  Future<BaseResponse?> submitLandPreparationForm(@Body() data);

  @GET('/srp/srp-land-preparation?date_action={dateAction}&srp_id={srpId}')
  Future<BaseResponse<List<SRPResultModel>>?> getLandPreparationForm(
    @Path('dateAction') String dateAction,
    @Path('srpId') int srpId,
  );

  /// Srp water irrigation
  @POST('/srp/srp-water-irrigation')
  Future<BaseResponse?> submitWaterIrrigationForm(@Body() data);

  @GET('/srp/srp-water-irrigation?date_action={dateAction}&srp_id={srpId}')
  Future<BaseResponse<List<SRPResultModel>>?> getWaterIrrigationForm(
    @Path('dateAction') String dateAction,
    @Path('srpId') int srpId,
  );

  /// Srp field visit
  @POST('/srp/srp-field_visit')
  Future<BaseResponse?> submitFieldVisitForm(@Body() data);

  @GET('/srp/srp-field_visit?date_action={dateAction}&srp_id={srpId}')
  Future<BaseResponse<List<SRPResultModel>>?> getFieldVisitForm(
    @Path('dateAction') String dateAction,
    @Path('srpId') int srpId,
  );

  /// Srp pesticide application
  @POST('/srp/srp-pesticide-application')
  Future<BaseResponse?> submitPesticideApplicationForm(@Body() data);

  @GET('/srp/srp-pesticide-application?date_action={dateAction}&srp_id={srpId}')
  Future<BaseResponse<List<SRPResultModel>>?> getPesticideApplicationForm(
    @Path('dateAction') String dateAction,
    @Path('srpId') int srpId,
  );

  /// Srp fertilizer application
  @POST('/srp/srp-fetilizer-application')
  Future<BaseResponse?> submitFetilizerApplicationForm(@Body() data);

  @GET('/srp/srp-fetilizer-application?date_action={dateAction}&srp_id={srpId}')
  Future<BaseResponse<List<SRPResultModel>>?> getFetilizerApplicationForm(
    @Path('dateAction') String dateAction,
    @Path('srpId') int srpId,
  );

  /// Srp women empowerment
  @POST('/srp/srp-women_empowerment')
  Future<BaseResponse?> submitWomenEmpowermentForm(@Body() data);

  @GET('/srp/srp-women_empowerment?date_action={dateAction}&srp_id={srpId}')
  Future<BaseResponse<List<SRPResultModel>>?> getWomenEmpowermentForm(
    @Path('dateAction') String dateAction,
    @Path('srpId') int srpId,
  );

  /// Srp labour right
  @POST('/srp/srp-labour-right')
  Future<BaseResponse?> submitLabourRightForm(@Body() data);

  @GET('/srp/srp-labour-right?date_action={dateAction}&srp_id={srpId}')
  Future<BaseResponse<List<SRPResultModel>>?> getLabourRightForm(
    @Path('dateAction') String dateAction,
    @Path('srpId') int srpId,
  );

  /// Srp harvest
  @POST('/srp/srp-harvest')
  Future<BaseResponse?> submitHarvestForm(@Body() data);

  @GET('/srp/srp-harvest?date_action={dateAction}&srp_id={srpId}')
  Future<BaseResponse<List<SRPResultModel>>?> getHarvestForm(
    @Path('dateAction') String dateAction,
    @Path('srpId') int srpId,
  );

  /// Srp health and safety
  @POST('/srp/srp-health_and_safety')
  Future<BaseResponse?> submitHealthAndSafetyForm(@Body() data);

  @GET('srp/srp-health_and_safety?date_action={dateAction}&srp_id={srpId}')
  Future<BaseResponse<List<SRPResultModel>>?> getHealthAndSafetyForm(
    @Path('dateAction') String dateAction,
    @Path('srpId') int srpId,
  );
}
