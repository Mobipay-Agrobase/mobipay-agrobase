import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/distribution/model_category.dart';
import 'package:agrobase_ekibbo/models/distribution/model_distribution.dart';
import 'package:agrobase_ekibbo/models/distribution/model_product.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class ApiDistribution {
  static Future<BaseResponse> createDistribution(FormData formData) async {
    try {
      final res = await ApiProvider.instance.apiDistribution
          .createDistribution(formData);
      if (res == null) {
        throw const FormatException('createDistribution response null');
      }
      if (res.result == null) {
        throw const FormatException('getProductsByCateId result null');
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

  static Future<List<MProduct>> getProductsByCateId(
      int cateId, int cooperId) async {
    try {
      final res = await ApiProvider.instance.apiDistribution
          .getProductsByCateId(cateId, cooperId);
      if (res == null) {
        throw const FormatException('getProductsByCateId response null');
      }
      if (res.data == null) {
        throw const FormatException('getProductsByCateId data null');
      }
      return res.data ?? [];
    } catch (e) {
      debugPrint("Error getProductsByCateId: $e");
      return [];
    }
  }

  static Future<List<MCategory>> getCategoryByCooperId(int id) async {
    try {
      final res = await ApiProvider.instance.apiDistribution
          .getCategoriesByCooperId(id);
      if (res == null) {
        throw const FormatException('getCategoryByCooperId response null');
      }
      if (res.data == null) {
        throw const FormatException('getCategoryByCooperId data null');
      }
      return res.data ?? [];
    } catch (e) {
      debugPrint("Error getCategoryByCooperId: $e");
      return [];
    }
  }

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
      return (res.data['previous_stocks'] ?? 0) * 1.0;
    } catch (e) {
      debugPrint("Error getPreviousStock: $e");
      return 0;
    }
  }
}
