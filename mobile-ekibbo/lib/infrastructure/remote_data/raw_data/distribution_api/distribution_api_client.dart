import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/distribution/model_category.dart';
import 'package:agrobase_ekibbo/models/distribution/model_distribution.dart';
import 'package:agrobase_ekibbo/models/distribution/model_product.dart';

part 'distribution_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class DistributionApiClient {
  factory DistributionApiClient(Dio dio, {String baseUrl}) =
      _DistributionApiClient;

  @GET('/cooperatives/{cooperId}/products?category_id={cateId}')
  Future<BaseResponse<List<MProduct>>?> getProductsByCateId(
      @Path('cateId') int cateId, @Path('cooperId') int cooperId);

  @GET('/cooperatives/{cooperId}/categories')
  Future<BaseResponse<List<MCategory>>?> getCategoriesByCooperId(
      @Path('cooperId') int cooperId);

  @POST('/distribution')
  Future<BaseResponse?> createDistribution(@Body() FormData data);

  @GET('/distribution?per_page=100')
  Future<BaseResponse<DataDistribution>?> getDistributions();

  @GET('/distribution/{disId}')
  Future<BaseResponse<MDistribution>?> getDistributionById(@Path('disId') int disId);

  @GET('/distribution/farmer/{farmer_id}/product/{product_id}/previous-stocks')
  Future<BaseResponse?> getPreviousStock(
      @Path('farmer_id') int farmerId, @Path('product_id') int productId);
}
