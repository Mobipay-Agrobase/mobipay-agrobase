import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:agrobase_ekibbo/domain/config/env_config.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/hivebox_manager/box_address.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/hivebox_manager/box_dropdown.dart';
import 'package:agrobase_ekibbo/models/distribution/model_cooperative.dart';
import 'package:agrobase_ekibbo/models/dropdown/crop/dropdown_crop_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/farm_land/drodown_farmland_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/register/dropdown_register_model.dart';
import 'package:agrobase_ekibbo/models/location/commune/commune_model.dart';
import 'package:agrobase_ekibbo/models/location/country/country_model.dart';
import 'package:agrobase_ekibbo/models/location/district/district_model.dart';
import 'package:agrobase_ekibbo/models/location/village/village_model.dart';
import 'package:agrobase_ekibbo/models/location/province/province_model.dart';

class ApiAddress {
  static Future<List<CountryModel>> getCountries() async {
    try {
      final res = await ApiProvider.instance.apiLocation.getCountries('country');
      if (res == null) {
        throw const FormatException('getCountries response null');
      }

      if (res.data == null) {
        throw const FormatException('getCountries data null');
      }
      BoxAddress.addCountries(res.data as List<CountryModel>);
      return res.data ?? [];
    } catch (e) {
      debugPrint("error $e");
      final res = await BoxAddress.getCountries();
      if (res.isEmpty) {
        return [];
      } else {
        return res
            .map((e) => CountryModel.fromJson(e.cast<String, dynamic>()))
            .toList();
      }
    }
  }

  static Future getAllProvices() async {
    try {
      final res = await ApiProvider.instance.apiLocation.getAllProvinces('province');
      if (res == null) throw const FormatException('getProvice response null');
      if (res.data == null) throw const FormatException('getProvice data null');
      return res.data;
    } catch (e) {
      debugPrint("error $e");
      return [];
    }
  }

  static Future<List<ProvinceModel>> getProvices(int id) async {
    try {
      final res = await ApiProvider.instance.apiLocation.getProvincesBy('province', id);
      if (res == null) throw const FormatException('getProvice response null');
      if (res.data == null) throw const FormatException('getProvice data null');
      //BoxAddress.addProvinces(res.data as List<ProvinceModel>);
      return res.data ?? [];
    } catch (e) {
      debugPrint("error $e");
      final res = await BoxAddress.getProvinces();
      if (res.isEmpty) {
        return [];
      } else {
        return res
            .map((e) => ProvinceModel.fromJson(e.cast<String, dynamic>()))
            .toList()
            .where((e) => e.countryId == id)
            .toList();
      }
    }
  }

  static Future<List<ProvinceModel>> getAllProvinces() async {
    try {
      final res = await ApiProvider.instance.apiLocation.getAllProvinces('province');
      if (res == null) throw const FormatException('getAllProvinces response null');
      if (res.data == null) throw const FormatException('getAllProvinces data null');
      BoxAddress.addProvinces(res.data as List<ProvinceModel>);
      return res.data ?? [];
    } catch (e) {
      debugPrint("error $e");
      final res = await BoxAddress.getProvinces();
      if (res.isEmpty) {
        return [];
      } else {
        return res.map((e) => ProvinceModel.fromJson(e.cast<String, dynamic>())).toList();
      }
    }
  }
  static Future<List<DistrictModel>> getDistricts(id) async {
    try {
      final res = await ApiProvider.instance.apiLocation.getDistrictsBy('district', id);
      if (res == null) throw const FormatException('getDistrict response null');
      if (res.data == null) {
        throw const FormatException('getDistrict data null');
      }
      //BoxAddress.addDistricts(res.data as List<DistrictModel>);
      return res.data ?? [];
    } catch (e) {
      debugPrint("error $e");
      final res = await BoxAddress.getDistricts();
      if (res.isEmpty) {
        return [];
      } else {
        return res
            .map((e) => DistrictModel.fromJson(e.cast<String, dynamic>()))
            .toList()
            .where((e) => e.provinceId == id)
            .toList();
      }
    }
  }
  static Future<List<DistrictModel>> getAllDistricts() async {
    try {
      final res = await ApiProvider.instance.apiLocation.getAllDistricts('district');
      if (res == null) throw const FormatException('getAllDistricts response null');
      if (res.data == null) throw const FormatException('getAllDistricts data null');
      BoxAddress.addDistricts(res.data as List<DistrictModel>);
      return res.data ?? [];
    } catch (e) {
      debugPrint("error $e");
      final res = await BoxAddress.getDistricts();
      if (res.isEmpty) {
        return [];
      } else {
        return res.map((e) => DistrictModel.fromJson(e.cast<String, dynamic>())).toList();
      }
    }
  }

  static Future<List<CommuneModel>> getCommunes(id) async {
    try {
      final res = await ApiProvider.instance.apiLocation.getCommuneBy('commune', id);
      if (res == null) throw const FormatException('getCommune response null');
      if (res.data == null) {
        throw const FormatException('getCommune data null');
      }
      //BoxAddress.addCommune(res.data as List<CommuneModel>);
      return res.data ?? [];
    } catch (e) {
      debugPrint("error $e");
      final res = await BoxAddress.getCommune();
      if (res.isEmpty) {
        return [];
      } else {
        return res
            .map((e) => CommuneModel.fromJson(e.cast<String, dynamic>()))
            .toList()
            .where((e) => e.districtId == id)
            .toList();
      }
    }
  }
  static Future<List<CommuneModel>> getAllCommunes() async {
    try {
      final res = await ApiProvider.instance.apiLocation.getAllCommunes('commune');
      if (res == null) throw const FormatException('getAllCommunes response null');
      if (res.data == null) throw const FormatException('getAllCommunes data null');
      BoxAddress.addCommune(res.data as List<CommuneModel>);
      return res.data ?? [];
    } catch (e) {
      debugPrint("error $e");
      final res = await BoxAddress.getCommune();
      if (res.isEmpty) {
        return [];
      } else {
        return res.map((e) => CommuneModel.fromJson(e.cast<String, dynamic>())).toList();
      }
    }
  }

  /// Top-level regions from the web Location Master (7-level cascade root).
  static Future<List<Map<String, dynamic>>> getRegions() async {
    try {
      final res = await ApiProvider.instance.apiLocation.getCountries('region');
      if (res == null || res.data == null) return [];
      return (res.data as List)
          .map((e) => {
                'id': (e as CountryModel).id ?? 0,
                'name': e.countryName ?? '',
              })
          .toList();
    } catch (e) {
      debugPrint("getRegions $e");
      return [];
    }
  }

  /// Generic child-level fetch for the 7-level cascade:
  /// sub-region | county | parish (each keyed by parent numeric id).
  static Future<List<Map<String, dynamic>>> getChildren(String type, int parentId) async {
    try {
      final res = await _dio().get(
        '/mobile/ekibbo-geo',
        queryParameters: {'type': type, 'parentId': parentId},
      );
      if (res.statusCode != 200 || res.data['result'] != true) return [];
      final data = res.data['data'] as List;
      return data.map((e) {
        final m = e as Map<String, dynamic>;
        return {
          'id': m['id'] as int,
          'name': (m['sub_region_name'] ?? m['county_name'] ?? m['parish_name'] ?? '') as String,
        };
      }).toList();
    } catch (e) {
      debugPrint("getChildren($type) $e");
      return [];
    }
  }

  static Dio _dio() => Dio(BaseOptions(
        baseUrl: EnvConfig.domainStream,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        validateStatus: (s) => true,
        headers: {
          'Authorization':
              'Bearer ${SharedPreferencesProvider.instance.accessToken}',
          'x-app-client': 'agrobase-ekibbo-flutter',
        },
      ));

  /// All districts from the web Location Master (mobile registration form
  /// starts at District level — matches the web Ekibbo flow).
  static Future<List<DistrictModel>> getAllDistrictsMaster() async {
    try {
      final res = await ApiProvider.instance.apiLocation.getAllDistricts('district');
      if (res == null) throw const FormatException('districts response null');
      if (res.data == null) throw const FormatException('districts data null');
      return res.data ?? [];
    } catch (e) {
      debugPrint("getAllDistrictsMaster $e");
      return [];
    }
  }

  /// Villages under a parish (web Location Master hierarchy).
  static Future<List<VillageModel>> getVillages(int parishId) async {
    try {
      final res = await ApiProvider.instance.apiLocation.getVillages('village', parishId);
      if (res == null) throw const FormatException('villages response null');
      if (res.data == null) throw const FormatException('villages data null');
      return res.data ?? [];
    } catch (e) {
      debugPrint("getVillages $e");
      return [];
    }
  }

  static Future<List<MCooperative>> getCooperatives() async {
    try {
      final res = await ApiProvider.instance.apiLocation.getCooperatives('cooperatives');
      if (res == null) {
        throw const FormatException('getCooperatives response null');
      }
      if (res.data == null) {
        throw const FormatException('getCooperatives data null');
      }
      BoxDropdown.addCooperatives(res.data as List<MCooperative>);
      return res.data ?? [];
    } catch (e) {
      debugPrint("error $e");
      final res = await BoxDropdown.getCooperatives();
      if (res.isEmpty) {
        return [];
      } else {
        return res
            .map((e) => MCooperative.fromJson(e.cast<String, dynamic>()))
            .toList();
      }
    }
  }

  static Future<DropdownRegisterModel> getDropDownForRegister() async {
    try {
      final res = await ApiProvider.instance.apiFarmer.getDropDownForRegister();
      if (res == null) {
        throw const FormatException('getDropDownForRegister response null');
      }
      if (res.data == null) {
        throw const FormatException('getDropDownForRegister data null');
      }
      BoxDropdown.addIdentityProof((res.data?.dataIdentityProof ?? []));
      BoxDropdown.addEnrollmentPlace((res.data?.dataEnrollmentPlace ?? []));
      BoxDropdown.addGender((res.data?.dataGender ?? []));
      return res.data!;
    } catch (e) {
      debugPrint("error $e");
      final resIdentityProof = await BoxDropdown.getIdentityProof().then(
          (datas) => datas
              .map((e) => DropdownDataModel.fromJson(e.cast<String, dynamic>()))
              .toList());
      final resEnrollmentPlace = await BoxDropdown.getEnrollmentPlace().then(
          (datas) => datas
              .map((e) => DropdownDataModel.fromJson(e.cast<String, dynamic>()))
              .toList());
      final resGender = await BoxDropdown.getGender().then((datas) => datas
          .map((e) => DropdownDataModel.fromJson(e.cast<String, dynamic>()))
          .toList());
      return DropdownRegisterModel()
        ..dataIdentityProof = resIdentityProof
        ..dataEnrollmentPlace = resEnrollmentPlace
        ..dataGender = resGender;
    }
  }

  //ApiProvider.instance.apiFarmland.getFarmLandDropdownData();
  static Future<DropdownFarmLandModel> getDropDownForFarmland() async {
    try {
      final res =
          await ApiProvider.instance.apiFarmland.getFarmLandDropdownData();
      if (res == null) {
        throw const FormatException('getDropDownForFarmland response null');
      }
      if (res.data == null) {
        throw const FormatException('getDropDownForFarmland data null');
      }
      BoxDropdown.addLandApproachRoad(res.data?.dataAppoarchRoad ?? []);
      BoxDropdown.addLandTopology(res.data?.dataLandTopolog ?? []);
      BoxDropdown.addLandGradient(res.data?.dataLandGradient ?? []);
      BoxDropdown.addLandOwnerShip(res.data?.dataLandWwnerShip ?? []);
      BoxDropdown.addLandDocument(res.data?.dataLandDocument ?? []);
      return res.data!;
    } catch (e) {
      debugPrint("error $e");
      final resLandApproachRoad = await BoxDropdown.getLandApproachRoad().then(
          (datas) => datas
              .map((e) => DropdownDataModel.fromJson(e.cast<String, dynamic>()))
              .toList());
      final resLandTopology = await BoxDropdown.getLandTopology().then(
          (datas) => datas
              .map((e) => DropdownDataModel.fromJson(e.cast<String, dynamic>()))
              .toList());
      final resLandGradient = await BoxDropdown.getLandGradient().then(
          (datas) => datas
              .map((e) => DropdownDataModel.fromJson(e.cast<String, dynamic>()))
              .toList());
      final dataLandWwnerShip = await BoxDropdown.getLandOwnerShip().then(
          (datas) => datas
              .map((e) => DropdownDataModel.fromJson(e.cast<String, dynamic>()))
              .toList());
      final resLandDocument = await BoxDropdown.getLandDocument().then(
          (datas) => datas
              .map((e) => DropdownDataModel.fromJson(e.cast<String, dynamic>()))
              .toList());
      return DropdownFarmLandModel()
        ..dataAppoarchRoad = resLandApproachRoad
        ..dataLandTopolog = resLandTopology
        ..dataLandGradient = resLandGradient
        ..dataLandWwnerShip = dataLandWwnerShip
        ..dataLandDocument = resLandDocument;
    }
  }

  static Future<DropdownCropModel> getDropdownCropData() async {
    try {
      final res = await ApiProvider.instance.apiCrop.getCropDropdownData();
      if (res == null) {
        throw const FormatException('getCropDropdownData response null');
      }
      if (res.data == null) {
        throw const FormatException('getCropDropdownData data null');
      }
      BoxDropdown.addCropInformation(res.data?.cropInformation ?? []);
      return res.data!;
    } catch (e) {
      debugPrint("error $e");
      final res = await BoxDropdown.getCropInformation().then((datas) => datas
          .map((e) => DropdownMasterModel.fromJson(e.cast<String, dynamic>()))
          .toList());
      return DropdownCropModel()..cropInformation = res;
    }
  }
}
