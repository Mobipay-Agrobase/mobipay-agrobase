import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/crop/crop_harvest_model.dart';
import 'package:agrobase_ekibbo/models/procurement/procurement_model.dart';
import 'package:agrobase_ekibbo/models/procurement/vendor_procurement.dart';
import 'package:agrobase_ekibbo/models/sale_intention/pre_harvest_model.dart';
import 'package:agrobase_ekibbo/models/vehicle/vehicle_number_model.dart';
import 'package:agrobase_ekibbo/models/vehicle/vehicle_type_model.dart';
import 'package:agrobase_ekibbo/models/warehouse/warehouse_model.dart';

part 'procurement_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class ProcurementApiClient {
  factory ProcurementApiClient(Dio dio, {String baseUrl}) =
      _ProcurementApiClient;

  @POST('/admin/crop_harvest')
  Future<BaseResponse?> createCropHarvest(@Body() FormData data);

  @GET('/crop_harvest')
  Future<BaseResponse<List<MCropHarvest>>> getCropHarvest();

  @GET('/warehouses')
  Future<BaseResponse<List<MWareHouse>>> getWarehouse();

  @GET('/vehicle_types')
  Future<BaseResponse<List<MVehicleType>>> getVehicleType();

  @GET('/vehicles?type_id={type_id}')
  Future<BaseResponse<List<MVehicleNumber>>> getVehicleNymber(
      @Path('type_id') int typeId);

  @GET('/post_harvest_qc?lang={lang}')
  Future<BaseResponse<List<MPreHarvestQC>>?> preHarvestQC(
      @Path('lang') String lang);

  @POST('/vendor_procurements')
  Future<BaseResponse?> createVendorProcurement(@Body() FormData data);

  @GET('/vendor_procurements')
  Future<BaseResponse<List<MRVendorProcurement>>> getVendorProcurements();

  @GET('/procurements')
  Future<BaseResponse<MProcurementResponse>> getProcurements();

  @POST('/procurements')
  Future<BaseResponse?> createProcurement(@Body() FormData data);
}
