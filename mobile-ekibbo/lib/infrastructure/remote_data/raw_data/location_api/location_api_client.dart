import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/distribution/model_cooperative.dart';
import 'package:agrobase_ekibbo/models/location/commune/commune_model.dart';
import 'package:agrobase_ekibbo/models/location/village/village_model.dart';
import 'package:agrobase_ekibbo/models/location/country/country_model.dart';
import 'package:agrobase_ekibbo/models/location/district/district_model.dart';
import 'package:agrobase_ekibbo/models/location/province/province_model.dart';

part 'location_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class LocationApiClient {
  factory LocationApiClient(Dio dio, {String baseUrl}) = _LocationApiClient;
  @GET('/mobile/ekibbo-geo')
  Future<BaseResponse<List<CountryModel>>?> getCountries(@Query('type') String type);
  @GET('/mobile/ekibbo-geo')
  Future<BaseResponse<List<ProvinceModel>>?> getAllProvinces(@Query('type') String type);
  @GET('/mobile/ekibbo-geo')
  Future<BaseResponse<List<ProvinceModel>>?> getProvincesBy(
      @Query('type') String type, @Query('parentId') int countryId);
  @GET('/mobile/ekibbo-geo')
  Future<BaseResponse<List<DistrictModel>>?> getDistrictsBy(
      @Query('type') String type, @Query('parentId') int provinceId);
  @GET('/mobile/ekibbo-geo')
  Future<BaseResponse<List<DistrictModel>>?> getAllDistricts(@Query('type') String type);
  @GET('/mobile/ekibbo-geo')
  Future<BaseResponse<List<CommuneModel>>?> getCommuneBy(
      @Query('type') String type, @Query('parentId') int districtId);
  @GET('/mobile/ekibbo-geo')
  Future<BaseResponse<List<CommuneModel>>?> getAllCommunes(@Query('type') String type);
  @GET('/mobile/ekibbo-geo')
  Future<BaseResponse<List<MCooperative>>?> getCooperatives(@Query('type') String type);
  @GET('/mobile/ekibbo-geo')
  Future<BaseResponse<List<VillageModel>>?> getVillages(
      @Query('type') String type, @Query('parentId') int subCountyId);
}
