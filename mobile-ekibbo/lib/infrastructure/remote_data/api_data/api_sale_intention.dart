import 'package:flutter/foundation.dart';
import 'package:agrobase_ekibbo/models/notifications/order/order_notification.dart';
import 'package:agrobase_ekibbo/models/sale_intention/pre_harvest_model.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

class ApiSaleIntention {
  static Future<List<MPreHarvestQC>> getPreHarvestQC() async {
    try {
      final res = await ApiProvider.instance.apiSaleIntention
          .preHarvestQC(SharedPreferencesProvider.instance.appLang);
      if (res == null) {
        throw const FormatException('getPreHarvestQC response null');
      }
      if (res.data == null) {
        throw const FormatException('getPreHarvestQC data null');
      }
      return res.data ?? [];
    } catch (e) {
      debugPrint("Error getPreHarvestQC: $e");
      return [];
    }
  }

  static Future<List<MOrderResponse>> getOrderSaleIntention() async {
    try {
      final res =
          await ApiProvider.instance.apiSaleIntention.getOrderSaleIntention();
      if (res == null) {
        throw const FormatException('getOrderSaleIntention response null');
      }
      if (res.data == null) {
        throw const FormatException('getOrderSaleIntention data null');
      }
      return res.data ?? [];
    } catch (e) {
      debugPrint("Error getOrderSaleIntention: $e");
      return [];
    }
  }
}
