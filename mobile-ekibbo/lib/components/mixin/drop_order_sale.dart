import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_sale_intention.dart';
import 'package:agrobase_ekibbo/models/notifications/order/order_notification.dart';

mixin DropOrderSaleMixin {
  final List<MOrderResponse> orderSaleIntentions = [];
  int orderSaleIntentionId = 0;

  Future fetchOrderSaleIntention() async {
    orderSaleIntentions.clear();
    final res = await ApiSaleIntention.getOrderSaleIntention();
    orderSaleIntentions.addAll(res);
  }

  indexOrderSaleIntention() {
    if (orderSaleIntentions.isEmpty || orderSaleIntentionId == 0) return null;
    final index = orderSaleIntentions
        .indexWhere((element) => element.order.id == orderSaleIntentionId);
    if (index == -1) return null;
    return index;
  }
}
