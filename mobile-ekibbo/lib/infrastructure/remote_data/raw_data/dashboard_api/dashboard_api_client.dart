import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/dashboard/dashboard_model.dart';
import 'package:agrobase_ekibbo/models/dashboard/dashboard_model_famer.dart';
import 'package:agrobase_ekibbo/models/notifications/notification_model.dart';
import 'package:agrobase_ekibbo/models/notifications/order/order_notification.dart';

part 'dashboard_api_client.g.dart';

@RestApi(baseUrl: '')
abstract class DashboardApiClient {
  factory DashboardApiClient(Dio dio, {String baseUrl}) = _DashboardApiClient;
  @GET('/mobile/ekibbo-home')
  Future<BaseResponse<DashboardModel>?> getDashboardData(
    @Query('lat') double lat,
    @Query('lng') double lng,
    @Query('nearby_km') double nearbyKm,
  );

  @GET('/mobile/ekibbo-home-farmer')
  Future<BaseResponse<MDashboardFarmer>?> getDashboardFarmer(
    @Query('lat') double lat,
    @Query('lng') double lng,
    @Query('nearby_km') double nearbyKm,
  );

  @GET('/notifications?type=order')
  Future<BaseResponse<List<MNotification<MOrderNotification>>>?>
      getNotificationOrder();
}
