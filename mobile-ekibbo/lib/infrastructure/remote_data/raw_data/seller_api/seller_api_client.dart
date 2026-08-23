import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
part 'seller_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class SellerApiClient {
  factory SellerApiClient(Dio dio, {String baseUrl}) = _SellerApiClient;

  @POST('/auth/login')
  Future<BaseResponse?> loginSeller(@Body() data);

  @POST('/auction/product_store_seller')
  Future<BaseResponse?> saveProduceSeller(@Body() FormData data);
}
