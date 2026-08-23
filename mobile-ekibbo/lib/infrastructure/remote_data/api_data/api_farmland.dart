import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/models/farmland_detail/farmland_detail_response.dart';

class ApiFarmland {
  static Future<List<FarmLandModel>> getFarmlandByFarmerId(int farmerId) async {
    try {
      final res =
          await ApiProvider.instance.apiFarmland.getAllFarmLands(farmerId);
      if (res == null) {
        throw const FormatException('getDashboardData response null');
      }
      if (res.data == null) {
        throw const FormatException('getDashboardData data null');
      }
      if (res.data!.farmLandData == null) {
        throw const FormatException('getDashboardData farmLandData null');
      }
      return res.data!.farmLandData ?? [];
    } catch (e) {
      debugPrint(e.toString());
      return [];
    }
  }

  static Future<List<CultivationModel>> getCultivations(
      int seasonId, int farmlandId, int cropId) async {
    try {
      final res = await ApiProvider.instance.apiFarmland
          .findCultivations(farmlandId, seasonId, cropId);
      if (res == null) {
        throw const FormatException('getCultivations response null');
      }
      if (res.data == null) {
        throw const FormatException('getCultivations data null');
      }
      return res.data ?? [];
    } catch (e) {
      debugPrint(e.toString());
      return [];
    }
  }

  static Future<FarmlandDetailResponse?> getDetailFarmland(int farmlandId) async {
    try {
      final res =
          await ApiProvider.instance.apiFarmland.getDetailFarmland(farmlandId);
      if (res == null) {
        throw const FormatException('getDetailFarmland response null');
      }
      if (res.data == null) {
        throw const FormatException('getDetailFarmland data null');
      }
      return res.data;
    } catch (e) {
      debugPrint(e.toString());
      return null;
    }
  }
}
