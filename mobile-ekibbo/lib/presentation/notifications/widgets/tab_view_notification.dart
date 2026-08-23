import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_listings.dart';
import 'package:agrobase_ekibbo/models/notifications/notification_model.dart';
import 'package:agrobase_ekibbo/models/notifications/order/order_notification.dart';
import 'package:agrobase_ekibbo/presentation/notifications/widgets/item_notification.dart';

class WTabViewNotification extends StatefulWidget {
  const WTabViewNotification({super.key, required this.type});
  final String type;

  @override
  State<WTabViewNotification> createState() => _WTabViewNotificationState();
}

class _WTabViewNotificationState extends State<WTabViewNotification> {
  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async {
        DListingData.instance.notificationOrders = null;
        setState(() {});
      },
      child: _buildFutureFetch(),
    );
  }

  _buildFutureFetch() {
    return FutureBuilder(
        future: DListingData.instance.getOrderNotifications(),
        builder: (context, snapshot) {
          switch (snapshot.connectionState) {
            case ConnectionState.waiting:
              return const Center(
                child: AppCircularIndicator(
                  color: ColorConstant.primary,
                ),
              );
            default:
              if (snapshot.hasError) {
                return ListView(
                  children: const [
                    NoDataView(),
                  ],
                );
              } else {
                if (snapshot.data == null) return const NoDataView();
                final datas =
                    snapshot.data as List<MNotification<MOrderNotification>>;
                if (datas.isEmpty) return const NoDataView();
                return ListView(
                  children: datas
                      .map(
                        (e) => WNotificationItem(
                          item: e,
                        ),
                      )
                      .toList(),
                );
              }
          }
        });
  }
}
