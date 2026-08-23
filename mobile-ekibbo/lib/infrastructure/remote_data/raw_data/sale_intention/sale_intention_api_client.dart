import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/notifications/order/order_notification.dart';
import 'package:agrobase_ekibbo/models/sale_intention/detail_sale_intention_response.dart';
import 'package:agrobase_ekibbo/models/sale_intention/pre_harvest_model.dart';
import 'package:agrobase_ekibbo/models/sale_intention/sale_intention_response.dart';
part 'sale_intention_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class SaleIntentionApiClient {
  factory SaleIntentionApiClient(Dio dio, {String baseUrl}) =
      _SaleIntentionApiClient;
  @GET('/sale_intention/get_all')
  Future<BaseResponse<SaleIntentionResponse>?> getListSaleIntention();

  @GET('/sale_intention/details/{productId}')
  Future<BaseResponse<DetailSaleIntentionResponse>?> getDetailSaleIntention(
      @Path('productId') String productId);

  @GET('/pre_harvest_qc?lang={lang}')
  Future<BaseResponse<List<MPreHarvestQC>>?> preHarvestQC(
      @Path('lang') String lang);

  @GET('/sale_intention/orders')
  Future<BaseResponse<List<MOrderResponse>>?> getOrderSaleIntention();
}
