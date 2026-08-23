import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:agrobase_ekibbo/models/base/base_response.dart';
import 'package:agrobase_ekibbo/models/crop/crop_harvest_model.dart';
import 'package:agrobase_ekibbo/models/procurement/procurement_model.dart';
import 'package:agrobase_ekibbo/models/procurement/vendor_procurement.dart';
import 'package:agrobase_ekibbo/models/sale_intention/pre_harvest_model.dart';
import 'package:agrobase_ekibbo/models/vehicle/vehicle_number_model.dart';
import 'package:agrobase_ekibbo/models/vehicle/vehicle_type_model.dart';
import 'package:agrobase_ekibbo/models/warehouse/warehouse_model.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

class ApiProcurement {
  static Future<BaseResponse> createCropHarvest(
      Map<String, dynamic> data) async {
    final formData = FormData.fromMap(data);
    try {
      final res =
          await ApiProvider.instance.apiProcurement.createCropHarvest(formData);
      if (res == null) {
        throw const FormatException('createCropHarvest response null');
      }
      if (res.result == null) {
        throw const FormatException('createCropHarvest result null');
      }
      return res;
    } catch (e) {
      debugPrint("Error createCropHarvest: $e");
      return BaseResponse(
          result: false, message: "An error occurred, please check again!");
    }
  }

  static Future<List<MCropHarvest>> fetchCropHarvest() async {
    try {
      final res = await ApiProvider.instance.apiProcurement.getCropHarvest();
      if (res.data == null) {
        throw const FormatException('fetchCropHarvest date null');
      }
      return res.data ?? [];
    } catch (e) {
      debugPrint("Error fetchCropHarvest: $e");
      return [];
    }
  }

  static Future<List<MVehicleType>> fetchVehicleType() async {
    try {
      final res = await ApiProvider.instance.apiProcurement.getVehicleType();
      if (res.data == null) {
        throw const FormatException('fetchVehicleType date null');
      }
      return res.data ?? [];
    } catch (e) {
      debugPrint("Error fetchVehicleType: $e");
      return [];
    }
  }

  static Future<List<MVehicleNumber>> fetchVehicleNumber(int id) async {
    try {
      final res =
          await ApiProvider.instance.apiProcurement.getVehicleNymber(id);
      if (res.data == null) {
        throw const FormatException('fetchVehicleNumber date null');
      }
      return res.data ?? [];
    } catch (e) {
      debugPrint("Error fetchVehicleNumber: $e");
      return [];
    }
  }

  static Future<List<MWareHouse>> fetchWareHouse() async {
    try {
      final res = await ApiProvider.instance.apiProcurement.getWarehouse();
      if (res.data == null) {
        throw const FormatException('fetchWareHouse date null');
      }
      return res.data ?? [];
    } catch (e) {
      debugPrint("Error fetchWareHouse: $e");
      return [];
    }
  }

  static Future<List<MPreHarvestQC>> getPreHarvestQC() async {
    try {
      final res = await ApiProvider.instance.apiProcurement
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

  static Future<BaseResponse> createVendorProcurement(FormData formData) async {
    try {
      final res = await ApiProvider.instance.apiProcurement
          .createVendorProcurement(formData);
      if (res == null) {
        throw const FormatException('createVendorProcurement response null');
      }
      if (res.result == null) {
        throw const FormatException('createVendorProcurement result null');
      }
      return res;
    } catch (e) {
      debugPrint("Error createVendorProcurement: $e");
      return BaseResponse(
          result: false, message: "An error occurred, please check again!");
    }
  }

  static Future<List<MRVendorProcurement>> getVendorProcurements() async {
    try {
      final res =
          await ApiProvider.instance.apiProcurement.getVendorProcurements();
      if (res.data == null) {
        throw const FormatException('getVendorProcurements data null');
      }
      return res.data ?? [];
    } catch (e) {
      debugPrint("Error getVendorProcurements: $e");
      return [];
    }
  }

  static Future<BaseResponse> createProcurement(FormData data) async {
    try {
      final res =
          await ApiProvider.instance.apiProcurement.createProcurement(data);
      if (res == null) {
        throw const FormatException('createProcurement response null');
      }
      if (res.result == null) {
        throw const FormatException('createProcurement result null');
      }
      return res;
    } catch (e) {
      debugPrint("Error createProcurement: $e");
      return BaseResponse(
          result: false, message: "An error occurred, please check again!");
    }
  }

  static Future<List<MProcurement>> fetchProcurement() async {
    try {
      final res = await ApiProvider.instance.apiProcurement.getProcurements();
      if (res.data == null) {
        throw const FormatException('fetchProcurement data null');
      }
      return res.data!.procurements;
    } catch (e) {
      debugPrint("Error fetchProcurement: $e");
      return [];
    }
  }
}
