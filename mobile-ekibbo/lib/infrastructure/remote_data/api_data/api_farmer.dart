import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:agrobase_ekibbo/domain/roles/role_config.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class ApiFarmer {
  static Future<FarmerModel?> getFarmerDetail(int id,
      {int has = 0, EnumUserRole role = EnumUserRole.staff}) async {
    try {
      late final res;
      if (role == EnumUserRole.farmer) {
        res = await ApiProvider.instance.apiFarmer.getFarmerByRoleFarmer();
      } else {
        res = await ApiProvider.instance.apiFarmer.getFarmer(id, has);
      }
      return res?.data?.farmerData;
    } catch (e) {
      debugPrint("error $e");
      return null;
    }
  }

  ///farmer-detail
  static Future<FarmerModel?> getFarmerDetailRoleFarmer() async {
    try {
      final res = await ApiProvider.instance.apiFarmer.getFarmerByRoleFarmer();
      if (res == null) {
        throw const FormatException('getFarmerDetailRoleFarmer response null');
      }
      if (res.data == null) {
        throw const FormatException('getFarmerDetailRoleFarmer data null');
      }
      return res.data!.farmerData;
    } catch (e) {
      debugPrint("error $e");
      return null;
    }
  }

  static Future<BaseResponse> registerFarmer(FormData formData) async {
    final res = await ApiProvider.instance.apiFarmer.registerFarmer(formData);
    if (res == null) {
      throw const FormatException('getFarmerDetail response null');
    }
    if (res.result == null) {
      throw const FormatException('getFarmerDetail result null');
    }
    return BaseResponse(result: res.result ?? false, message: res.message);
  }

  static Future<BaseResponse> updateFarmer(FormData formData) async {
    try {
      final res = await ApiProvider.instance.apiFarmer.updateFarmer(formData);
      if (res == null) {
        throw const FormatException('getFarmerDetail response null');
      }
      if (res.result == null) {
        throw const FormatException('getFarmerDetail result null');
      }
      return BaseResponse(result: res.result ?? false, message: res.message);
    } catch (e) {
      debugPrint("error $e");
      return BaseResponse(result: false);
    }
  }

  static Future<List<FarmerModel>> searchFarmer(String name) async {
    try {
      final res = await ApiProvider.instance.apiFarmer.searchFarmer(name);
      if (res == null) {
        throw const FormatException('searchFarmer response null');
      }
      if (res.data == null) {
        throw const FormatException('searchFarmer data null');
      }
      return res.data!.farmerData;
    } catch (e) {
      debugPrint("error $e");
      return [];
    }
  }

  static Future<List<FarmerModel>> searchFarmerDistribution(
      {int cooperativeId = 0,
      int provinceId = 0,
      int communeId = 0,
      String search = '',
      int has = 0,
      int perPage = 10}) async {
    try {
      final res = await ApiProvider.instance.apiFarmer.searchFarmerDistribution(
          cooperativeId,
          "${provinceId == 0 ? '' : provinceId}",
          "${communeId == 0 ? '' : communeId}",
          search,
          perPage,
          has,
          10);
      if (res == null) {
        throw const FormatException('searchFarmer response null');
      }
      if (res.data == null) {
        throw const FormatException('searchFarmer data null');
      }
      if (res.data!.farmerData == null) {
        throw const FormatException('searchFarmer farmerData null');
      }
      return res.data!.farmerData!.data ?? [];
    } catch (e) {
      debugPrint("error $e");
      return [];
    }
  }
}
