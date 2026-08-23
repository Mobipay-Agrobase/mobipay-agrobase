import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/all_farmer/all_farmer_response.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_search_response.dart';
import 'package:agrobase_ekibbo/models/animal_husbandry/animal_husbandry_response.dart';
import 'package:agrobase_ekibbo/models/asset_info/asset_info_response.dart';
import 'package:agrobase_ekibbo/models/bank_info/bank_info_response.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/certificate/certificate_response.dart';
import 'package:agrobase_ekibbo/models/dropdown/register/dropdown_register_model.dart';
import 'package:agrobase_ekibbo/models/family_info/family_info_response.dart';
import 'package:agrobase_ekibbo/models/farm_equipment/farm_equipment_response.dart';
import 'package:agrobase_ekibbo/models/farmer_detail/farmer_detail_response.dart';
import 'package:agrobase_ekibbo/models/finance_info/finance_info_response.dart';
import 'package:agrobase_ekibbo/models/insurance/insurance_info_response.dart';

part 'farmer_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class FarmerApiClient {
  factory FarmerApiClient(Dio dio, {String baseUrl}) = _FarmerApiClient;

  @GET('/farmer/drop_down_for_register')
  Future<BaseResponse<DropdownRegisterModel>?> getDropDownForRegister();
  @POST('/farmer/registration')
  @MultiPart()
  Future<BaseResponse?> registerFarmer(@Body() FormData data);

  @GET('/farmer')
  Future<BaseResponse<AllFarmerResponse>?> getAllFarmers(
    @Query('page') int? page,
    @Query('search') String search,
  );

  @GET('/farmer/{id}')
  Future<BaseResponse<FarmerDetailResponse>?> getFarmer(
      @Path('id') int id, @Query('whereHasCultivation') int has);
  
  @GET('/farmer-detail')
  Future<BaseResponse<FarmerDetailResponse>?> getFarmerByRoleFarmer();

  @GET('/farmer-search/{name}')
  Future<BaseResponse<FarmerSearchResponse>?> searchFarmer(
      @Path('name') String name);
  @GET('/farmer')
  Future<BaseResponse<AllFarmerResponse>?> searchFarmerDistribution(
    @Query('cooperative_id') int cooperativeId,
    @Query('province') String provinceId,
    @Query('commune') String communeId,
    @Query('search') String search,
    @Query('per_page') int perPage,
    @Query('whereHasCultivation') int has,
    @Query('page') int page,
  );

  @POST('/farmer/update_personal_info')
  @MultiPart()
  Future<BaseResponse<FarmerModel>?> updateFarmer(@Body() FormData data);

  @GET('/farmer/get_data_for_family_info/{farmerId}')
  Future<BaseResponse<FamilyInfoResponse>?> getFamilyInfo(
      @Path('farmerId') int farmerId);
  @PUT('/farmer/update_family_info/{farmerId}')
  Future<BaseResponse?> updateFamilyInfo(
    @Path('farmerId') int farmerId,
    @Body() data,
  );
  @GET('/farmer/get_data_for_asset_info/{farmerId}')
  Future<BaseResponse<AssetInfoResponse>?> getAssetInfo(
      @Path('farmerId') int farmerId);

  @PUT('/farmer/update_asset_info/{farmerId}')
  Future<BaseResponse?> updateAssetInfo(
    @Path('farmerId') int farmerId,
    @Body() data,
  );
  @GET('/farmer/get_data_for_bank_info/{farmerId}')
  Future<BaseResponse<BankInfoResponse>?> getBankInfo(
      @Path('farmerId') int farmerId);

  @PUT('/farmer/update_bank_info/{farmerId}')
  Future<BaseResponse?> updateBankInfo(
    @Path('farmerId') int farmerId,
    @Body() data,
  );
  @GET('/farmer/get_data_for_finance_info/{farmerId}')
  Future<BaseResponse<FinanceInfoResponse>?> getFinanceInfo(
      @Path('farmerId') int farmerId);

  @PUT('/farmer/update_finance_info/{farmerId}')
  Future<BaseResponse?> updateFinanceInfo(
    @Path('farmerId') int farmerId,
    @Body() data,
  );
  @GET('/farmer/get_data_for_farm_equipment/{farmerId}')
  Future<BaseResponse<FarmEquipmentResponse>?> getFarmEquipment(
      @Path('farmerId') int farmerId);

  @PUT('/farmer/update_farm_equipment/{farmerId}')
  Future<BaseResponse?> updateFarmEquipment(
    @Path('farmerId') int farmerId,
    @Body() data,
  );
  @GET('/farmer/get_data_for_animal_husbandry/{farmerId}')
  Future<BaseResponse<AnimalHusbandryResponse>?> getAnimalHusbandry(
      @Path('farmerId') int farmerId);

  @PUT('/farmer/update_animal_husbandry/{farmerId}')
  Future<BaseResponse?> updateAnimalHusbandry(
    @Path('farmerId') int farmerId,
    @Body() data,
  );
  @GET('/farmer/get_data_for_insurance_info/{farmerId}')
  Future<BaseResponse<InsuranceInfoResponse>?> getInsuranceData(
      @Path('farmerId') int farmerId);

  @PUT('/farmer/update_insurance_info/{farmerId}')
  Future<BaseResponse?> updateInsuranceData(
    @Path('farmerId') int farmerId,
    @Body() data,
  );
  @GET('/farmer/get_data_for_certificate_info/{farmerId}')
  Future<BaseResponse<CertificateResponse>?> getCertificateInfo(
      @Path('farmerId') int farmerId);

  @PUT('/farmer/update_certificate/{farmerId}')
  Future<BaseResponse?> updateCertificateInfo(
    @Path('farmerId') int farmerId,
    @Body() data,
  );
}
