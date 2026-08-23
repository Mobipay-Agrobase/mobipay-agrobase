import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/distribution/model_cooperative.dart';
import 'package:agrobase_ekibbo/models/location/commune/commune_model.dart';
import 'package:agrobase_ekibbo/models/location/country/country_model.dart';
import 'package:agrobase_ekibbo/models/location/district/district_model.dart';
import 'package:agrobase_ekibbo/models/location/province/province_model.dart';

part 'location_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class LocationApiClient {
  factory LocationApiClient(Dio dio, {String baseUrl}) = _LocationApiClient;
  @GET('/country')
  Future<BaseResponse<List<CountryModel>>?> getCountries();
  @GET('/province')
  Future<BaseResponse<List<ProvinceModel>>?> getAllProvinces();
  @GET('/province_filter_by_country/{countryId}')
  Future<BaseResponse<List<ProvinceModel>>?> getProvincesBy(
      @Path('countryId') int countryId);
  @GET('/district_filter_by_province/{provinceId}')
  Future<BaseResponse<List<DistrictModel>>?> getDistrictsBy(
      @Path('provinceId') int provinceId);
  @GET('/district')
  Future<BaseResponse<List<DistrictModel>>?> getAllDistricts();
  @GET('/commune_filter_by_district/{districtId}')
  Future<BaseResponse<List<CommuneModel>>?> getCommuneBy(
      @Path('districtId') int districtId);
  @GET('/commune')
  Future<BaseResponse<List<CommuneModel>>?> getAllCommunes();
  @GET('/cooperatives')
  Future<BaseResponse<List<MCooperative>>?> getCooperatives();
}
