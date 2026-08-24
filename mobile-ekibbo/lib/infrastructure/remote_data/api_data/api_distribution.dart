import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/distribution/model_category.dart';
import 'package:agrobase_ekibbo/models/distribution/model_distribution.dart';
import 'package:agrobase_ekibbo/models/distribution/model_product.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

/// Input Allocation service — backed by the WEB PLATFORM's
/// InputProduct / InputDistribution tables via the mobile-ekibbo routes.
class ApiDistribution {
  static Future<BaseResponse> createDistribution(FormData formData) async {
    try {
      final res = await ApiProvider.instance.apiDistribution
          .createDistribution(formData);
      if (res == null) {
        throw const FormatException('createDistribution response null');
      }
      if (res.result == null) {
        throw const FormatException('createDistribution result null');
      }
      return res;
    } catch (e) {
      debugPrint("Error createDistribution: $e");
      return BaseResponse(
          result: false, message: "An error occurred, please check again!");
    }
  }

  static Future<List<MDistribution>> getDistributions() async {
    try {
      final res = await ApiProvider.instance.apiDistribution.getDistributions();
      if (res == null) {
        throw const FormatException('getDistributions response null');
      }
      if (res.data == null) {
        throw const FormatException('getDistributions data null');
      }
      return res.data!.distributions;
    } catch (e) {
      debugPrint("Error getDistributions: $e");
      return [];
    }
  }

  static void getDistributionDetail() async {}

  /// Products of one category for the Input Allocation form. `farmerId`
  /// (optional, pass 0 to skip) enriches each row with the farmer's
  /// previously-distributed quantity.
  static Future<List<MProduct>> getProductsByCateId(
      int cateId, int farmerId) async {
    try {
      final res = await ApiProvider.instance.apiDistribution
          .getProducts(cateId, farmerId);
      if (res == null) {
        throw const FormatException('getProducts response null');
      }
      if (res.data == null) {
        throw const FormatException('getProducts data null');
      }
      return res.data ?? [];
    } catch (e) {
      debugPrint("Error getProductsByCateId: $e");
      return [];
    }
  }

  /// Distinct input categories (Seeds, Fertilizer, Pesticide, Equipment…)
  /// derived from the web InputProduct master.
  static Future<List<MCategory>> getCategoryByCooperId(int id) async {
    try {
      final res = await ApiProvider.instance.apiDistribution.getCategories();
      if (res == null) {
        throw const FormatException('getCategories response null');
      }
      if (res.data == null) {
        throw const FormatException('getCategories data null');
      }
      return res.data ?? [];
    } catch (e) {
      debugPrint("Error getCategoryByCooperId: $e");
      return [];
    }
  }

  /// Previously distributed quantity of [productId] for [farmerId].
  static Future<double> getPreviousStock(int farmerId, int productId) async {
    try {
      final res = await ApiProvider.instance.apiDistribution
          .getPreviousStock(farmerId, productId);
      if (res == null) {
        throw const FormatException('getPreviousStock response null');
      }
      if (res.data == null) {
        throw const FormatException('getPreviousStock data null');
      }
      final data = res.data;
      if (data is Map<String, dynamic>) {
        return ((data['previous_stock'] ?? data['previous_stocks']) ?? 0) * 1.0;
      }
      return 0;
    } catch (e) {
      debugPrint("Error getPreviousStock: $e");
      return 0;
    }
  }
}
