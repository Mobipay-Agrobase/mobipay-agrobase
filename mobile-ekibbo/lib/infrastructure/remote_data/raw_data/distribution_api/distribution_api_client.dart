import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/distribution/model_category.dart';
import 'package:agrobase_ekibbo/models/distribution/model_distribution.dart';
import 'package:agrobase_ekibbo/models/distribution/model_product.dart';

part 'distribution_api_client.g.dart';

/// Input Allocation (Input Distribution) — served by the WEB PLATFORM's
/// tenant-scoped InputProduct / InputDistribution tables:
///   GET  /mobile/ekibbo-input-products?type=categories
///   GET  /mobile/ekibbo-input-products?category_id=&farmer_id=
///   POST /mobile/ekibbo-distribution      (multipart)
///   GET  /mobile/ekibbo-distribution      (history)
/// The legacy upstream `/cooperatives/{id}/...` routes no longer exist.
@RestApi(baseUrl: '')
abstract class DistributionApiClient {
  factory DistributionApiClient(Dio dio, {String baseUrl}) =
      _DistributionApiClient;

  @GET('/mobile/ekibbo-input-products')
  Future<BaseResponse<List<MProduct>>?> getProducts(
    @Query('category_id') int categoryId,
    @Query('farmer_id') int farmerId,
  );

  @GET('/mobile/ekibbo-input-products?type=categories')
  Future<BaseResponse<List<MCategory>>?> getCategories();

  @POST('/mobile/ekibbo-distribution')
  Future<BaseResponse?> createDistribution(@Body() FormData data);

  @GET('/mobile/ekibbo-distribution')
  Future<BaseResponse<DataDistribution>?> getDistributions();

  @GET('/mobile/ekibbo-distribution/{disId}')
  Future<BaseResponse<MDistribution>?> getDistributionById(
      @Path('disId') int disId);

  @GET('/mobile/ekibbo-input-products?previous_only=true')
  Future<BaseResponse?> getPreviousStock(
    @Query('farmer_id') int farmerId,
    @Query('product_id') int productId,
  );
}
