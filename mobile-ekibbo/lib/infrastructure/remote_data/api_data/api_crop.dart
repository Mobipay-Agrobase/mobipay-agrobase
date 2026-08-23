import 'package:flutter/foundation.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/crop/dropdown_crop_model.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class ApiCrop {
  static Future<DropdownCropModel?> getDataDropDownCrop() async {
    try {
      final res = await ApiProvider.instance.apiCrop.getCropDropdownData();
      if (res == null) {
        throw const FormatException('getDataDropDownCrop response null');
      }
      if (res.data == null) {
        throw const FormatException('getDataDropDownCrop data null');
      }
      return res.data!;
    } catch (e) {
      debugPrint(e.toString());
      return null;
    }
  }

  static Future<DropdownCropModel?> fetchCropCutivated(
      int farmlandId, int seasonId) async {
    try {
      final res = await ApiProvider.instance.apiCrop
          .getCropCutivated(farmlandId, seasonId);
      if (res == null) {
        throw const FormatException('fetchCropCutivated response null');
      }
      if (res.data == null) {
        throw const FormatException('fetchCropCutivated data null');
      }
      return res.data!;
    } catch (e) {
      debugPrint(e.toString());
      return null;
    }
  }

  static Future<List<CultivationModel>> fetchCropByFarmId(int farmId) async {
    try {
      final res =
          await ApiProvider.instance.apiFarmland.getCultivations(farmId);
      return res?.data?.cultivation ?? [];
    } catch (e) {
      debugPrint("fetchCropByFarmId $e");
      return [];
    }
  }
}
