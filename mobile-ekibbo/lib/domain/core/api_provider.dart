import 'package:hive_flutter/hive_flutter.dart';
import 'package:agrobase_ekibbo/domain/config/env_config.dart';
import 'package:agrobase_ekibbo/domain/core/network/dio_client.dart';
import 'package:agrobase_ekibbo/domain/core/network/interceptor/tenant_interceptor.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/auth/agrobase_auth_service.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/auth_api/auth_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/carbon_api/carbon_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/crop_api/crop_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/dashboard_api/dashboard_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/distribution_api/distribution_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/farm_land/farm_land_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/farmer_api/farmer_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/infomation/check_fishing_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/infomation/feeding_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/infomation/mortalities_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/infomation/species_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/infomation/water_quality_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/location_api/location_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/master_api/catalogue_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/procurement_api/procurement_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/sale_intention/sale_intention_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/seller_api/seller_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/srp_client/srp_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/stock/creation_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/stock/transfer_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/upload/upload_api_client.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/raw_data/weather_api/weather_api_client.dart';

class ApiProvider {
  ApiProvider._privateConstructor();
  static final ApiProvider instance = ApiProvider._privateConstructor();
  late final DioClient _dioWeather;
  late final DioClient _dio;
  late final DioClient _dioSeller;

  /*
      connect to weather
  */
  late final WeatherApiClient apiWeather;

  /*
      connect to Agrobase content service
  */
  late final SellerApiClient apiSeller;

  /*
      connect to upstream
  */
  late final SRPApiClient apiSRP;
  late final AuthApiClient apiAuth;
  late final CropApiClient apiCrop;
  late final CarbonApiClient apiCarbon;
  late final FarmerApiClient apiFarmer;
  late final LocationApiClient apiLocation;
  late final FarmLandApiClient apiFarmland;
  late final DashboardApiClient apiDashboard;
  late final ProcurementApiClient apiProcurement;
  late final DistributionApiClient apiDistribution;
  late final SaleIntentionApiClient apiSaleIntention;
  late final SpeciesApiClient apiSpecies;
  late final MortalityApiClient apiMortality;
  late final FeedingApiClient apiFeeding;
  late final CheckFishingApiClient apiCheckFishing;
  late final WaterQualityApiClient apiWaterQuality;
  late final UploadApiClient apiUpload;
  late final StockCreationApiClient apiStockCreation;
  late final StockTransferApiClient apiStockTransfer;
  late final CatalogueApiClient apiCatalogue;
  
  

  /*
    setup
  */
  Future<void> initialize() async {
    Hive.initFlutter();
    if (!SharedPreferencesProvider.instance.isInstance) {
      await SharedPreferencesProvider.instance.init();
    }

    // Agrobase authentication (multi-tenant login)
    AgrobaseAuthService.instance.init(baseUrl: EnvConfig.domainStream);

    _dioWeather = DioClient(baseUrl: EnvConfig.domainWeather);
    _dio = DioClient(
        
        baseUrl:
            EnvConfig.baseUrl(SharedPreferencesProvider.instance.isEnvPro));
    _dioSeller = DioClient(
        baseUrl:
            EnvConfig.sellerUrl(SharedPreferencesProvider.instance.isEnvPro));

    // Multi-tenant isolation: attach the tenant context to every request.
    // (Authoritative enforcement lives server-side — the backend derives the
    // tenant scope from the Bearer token; this labels requests with the
    // signed-in tenant for logging & routing.)
    _dio.dio.interceptors.add(TenantInterceptor());
    _dioSeller.dio.interceptors.add(TenantInterceptor());

    login();

    
    /*
      connect Agrobase content service
    */
    apiWeather = WeatherApiClient(_dioWeather.dio);
    /*
      connect Agrobase content service
    */
    apiSeller = SellerApiClient(_dioSeller.dio);

    /*
      connect upstream
    */
    apiSRP = SRPApiClient(_dio.dio);
    apiAuth = AuthApiClient(_dio.dio);
    apiCrop = CropApiClient(_dio.dio);
    apiCarbon = CarbonApiClient(_dio.dio);
    apiFarmer = FarmerApiClient(_dio.dio);
    apiLocation = LocationApiClient(_dio.dio);
    apiFarmland = FarmLandApiClient(_dio.dio);
    apiDashboard = DashboardApiClient(_dio.dio);
    apiProcurement = ProcurementApiClient(_dio.dio);
    apiDistribution = DistributionApiClient(_dio.dio);
    apiSaleIntention = SaleIntentionApiClient(_dio.dio);
    apiSpecies = SpeciesApiClient(_dio.dio, baseUrl: EnvConfig.domainStreamSupport);
    apiMortality = MortalityApiClient(_dio.dio, baseUrl: EnvConfig.domainStreamSupport);
    apiFeeding = FeedingApiClient(_dio.dio, baseUrl: EnvConfig.domainStreamSupport);
    apiCheckFishing = CheckFishingApiClient(_dio.dio, baseUrl: EnvConfig.domainStreamSupport);
    apiWaterQuality = WaterQualityApiClient(_dio.dio, baseUrl: EnvConfig.domainStreamSupport);
    apiUpload = UploadApiClient(_dio.dio, baseUrl: EnvConfig.domainStreamSupport);
    apiStockCreation = StockCreationApiClient(_dio.dio, baseUrl: EnvConfig.domainStreamSupport);
    apiStockTransfer = StockTransferApiClient(_dio.dio, baseUrl: EnvConfig.domainStreamSupport);
    apiCatalogue = CatalogueApiClient(_dio.dio, baseUrl: EnvConfig.domainStreamSupport);
  }

  setToken(String token) {
    _dio.dio.options.headers['Authorization'] = "Bearer $token";
  }

  setTokenSeller(String token) {
    _dioSeller.dio.options.headers['Authorization'] = "Bearer $token";
  }

  captureLocation(double lat, double lng) {
    _dio.dio.options.headers['lat'] = lat;
    _dio.dio.options.headers['lng'] = lng;
  }

  login() {
    if (SharedPreferencesProvider.instance.accessToken.isNotEmpty) {
      setToken(SharedPreferencesProvider.instance.accessToken);
    }
  }

  switchMode() {
    _dio.dio.options.baseUrl =
        EnvConfig.baseUrl(SharedPreferencesProvider.instance.isEnvPro);
    _dioSeller.dio.options.baseUrl =
        EnvConfig.sellerUrl(SharedPreferencesProvider.instance.isEnvPro);
  }

  showLogs() {
    return "url_up: ${_dio.dio.options.baseUrl} \n\nurl_content: ${_dioSeller.dio.options.baseUrl}";
  }
}
