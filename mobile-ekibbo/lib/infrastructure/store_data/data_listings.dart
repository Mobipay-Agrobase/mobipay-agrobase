import 'package:flutter/foundation.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_distribution.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_procurement.dart';
import 'package:agrobase_ekibbo/models/crop/crop_harvest_model.dart';
import 'package:agrobase_ekibbo/models/distribution/model_distribution.dart';
import 'package:agrobase_ekibbo/models/information/check_fishing_response.dart';
import 'package:agrobase_ekibbo/models/information/feeding_response.dart';
import 'package:agrobase_ekibbo/models/information/mortality_response.dart';
import 'package:agrobase_ekibbo/models/information/water_quality_response.dart';
import 'package:agrobase_ekibbo/models/notifications/notification_model.dart';
import 'package:agrobase_ekibbo/models/notifications/order/order_notification.dart';
import 'package:agrobase_ekibbo/models/procurement/procurement_model.dart';
import 'package:agrobase_ekibbo/models/sale_intention/sale_intention_response.dart';
import 'package:agrobase_ekibbo/models/stock/creation_response.dart';
import 'package:agrobase_ekibbo/models/stock/transfer_response.dart';

class DListingData {
  DListingData._privateConstructor();
  static final DListingData instance = DListingData._privateConstructor();

  List<MNotification<MOrderNotification>>? notificationOrders;
  List<MProcurement>? procurements;
  List<SaleIntentionModel>? saleIntentions;
  List<MCropHarvest>? cropHartvests;
  List<MDistribution>? distributions;

  List<CheckFishingResponse>? checkFishings;
  List<WaterQualityInfoResponse>? waterQualities;
  List<FeedingInfoResponse>? feedings;
  List<MortalitiesInfoResponse>? mortalities;
  List<StockCreationResponse>? stockCreations;
  List<StockTransferResponse>? stockTransfer;

  Future fetchStockCreation() async {
    try {
      if (stockCreations == null) {
        final res = await ApiProvider.instance.apiStockCreation.fetch();
        if (res?.data == null) {
          throw const FormatException('fetchStockCreation date null');
        }
        stockCreations = res?.data ?? [];
      }
      return stockCreations;
    } catch (e) {
      debugPrint("Error fetchStockCreation: $e");
      return [];
    }
  }

  Future fetchStockTransfer() async {
    try {
      if (stockTransfer == null) {
        final res = await ApiProvider.instance.apiStockTransfer.fetch();
        if (res?.data == null) {
          throw const FormatException('fetchStockTransfer date null');
        }
        stockTransfer = res?.data ?? [];
      }
      return stockTransfer;
    } catch (e) {
      debugPrint("Error fetchStockTransfer: $e");
      return [];
    }
  }

  Future fetchCheckFishing() async {
    try {
      if (checkFishings == null) {
        final res = await ApiProvider.instance.apiCheckFishing.fetch();
        if (res?.data == null) {
          throw const FormatException('fetchCheckFishing date null');
        }
        checkFishings = res?.data ?? [];
      }
      return checkFishings;
    } catch (e) {
      debugPrint("Error fetchCheckFishing: $e");
      return [];
    }
  }

  Future fetchFeeding() async {
    try {
      if (feedings == null) {
        final res = await ApiProvider.instance.apiFeeding.fetch();
        if (res?.data == null) {
          throw const FormatException('fetchFeeding date null');
        }
        feedings = res?.data ?? [];
      }
      return feedings;
    } catch (e) {
      debugPrint("Error fetchFeeding: $e");
      return [];
    }
  }

  Future fetchWaterQuality() async {
    try {
      if (waterQualities == null) {
        final res = await ApiProvider.instance.apiWaterQuality.fetch();
        if (res?.data == null) {
          throw const FormatException('fetchFeeding date null');
        }
        waterQualities = res?.data ?? [];
      }
      return waterQualities;
    } catch (e) {
      debugPrint("Error fetchFeeding: $e");
      return [];
    }
  }

  Future fetchMortality() async {
    try {
      if (mortalities == null) {
        final res = await ApiProvider.instance.apiMortality.fetch();
        if (res?.data == null) {
          throw const FormatException('fetchMortality date null');
        }
        mortalities = res?.data ?? [];
      }
      return mortalities;
    } catch (e) {
      debugPrint("Error fetchMortality: $e");
      return [];
    }
  }


  Future fetchCropHarvest() async {
    try {
      if (cropHartvests == null) {
        final res = await ApiProvider.instance.apiProcurement.getCropHarvest();
        if (res.data == null) {
          throw const FormatException('fetchCropHarvest date null');
        }
        cropHartvests = res.data ?? [];
      }
      return cropHartvests;
    } catch (e) {
      debugPrint("Error fetchCropHarvest: $e");
      return [];
    }
  }

  Future fetchSaleIntention() async {
    try {
      if (saleIntentions == null) {
        final res =
            await ApiProvider.instance.apiSaleIntention.getListSaleIntention();
        saleIntentions = res?.data?.dataSaleIntention ?? [];
      }
      return saleIntentions;
    } catch (e) {
      debugPrint("Error fetchSaleIntention: $e");
      return [];
    }
  }

  Future fetchProcurement() async {
    if (procurements == null) {
      final res = await ApiProcurement.fetchProcurement();
      procurements = res;
    }
    return procurements;
  }

  Future<List<MNotification<MOrderNotification>>>
      getOrderNotifications() async {
    if (notificationOrders != null) {
      return notificationOrders!;
    }
    try {
      final res =
          await ApiProvider.instance.apiDashboard.getNotificationOrder();
      if (res == null) {
        throw const FormatException('getOrderNotifications response null');
      }
      if (res.data == null) {
        throw const FormatException('getOrderNotifications data null');
      }
      notificationOrders = res.data;
      return res.data!;
    } catch (e) {
      debugPrint(e.toString());
      notificationOrders = [];
      return [];
    }
  }

  Future<List<MDistribution>> fetchDistributions() async {
    try {
      if (distributions == null) {
        final res = await ApiDistribution.getDistributions();
        distributions = res;
      }
      return distributions ?? [];
    } catch (e) {
      debugPrint("Error fetchDistributions: $e");
      distributions = [];
      return [];
    }
  }

  switchMode() {
    notificationOrders = null;
    procurements = null;
    saleIntentions = null;
    cropHartvests = null;
    distributions = null;
  }
}
