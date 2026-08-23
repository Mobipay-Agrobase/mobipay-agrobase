import 'package:hive_flutter/hive_flutter.dart';
import 'package:agrobase_ekibbo/models/location/commune/commune_model.dart';
import 'package:agrobase_ekibbo/models/location/country/country_model.dart';
import 'package:agrobase_ekibbo/models/location/district/district_model.dart';
import 'package:agrobase_ekibbo/models/location/province/province_model.dart';

class BoxAddress {
  static const String boxName = 'address';
  static const String keyCountries = 'countries';
  static const String keyProvinces = 'provinces';
  static const String keyDistrics = 'districs';
  static const String keyCommunes = 'communes';

  static Box? box;

  static Future _init() async {
    if (box != null) return;
    box = await Hive.openBox(boxName);
  }

  static Future<List<dynamic>> getCooperatives() async {
    await _init();
    return box!.get(keyCountries) ?? [];
  }

  static Future addCooperatives(List<CountryModel> datas) async {
    await _init();
    box!.put(keyCountries, datas.map((e) => e.toMap()).toList());
  }

  static Future<List<dynamic>> getCountries() async {
    await _init();
    return box!.get(keyCountries) ?? [];
  }

  static Future addCountries(List<CountryModel> datas) async {
    await _init();
    box!.put(keyCountries, datas.map((e) => e.toMap()).toList());
  }

  static Future<List<dynamic>> getProvinces() async {
    await _init();
    return box!.get(keyProvinces) ?? [];
  }

  static Future addProvinces(List<ProvinceModel> datas) async {
    await _init();
    box!.put(keyProvinces, datas.map((e) => e.toMap()).toList());
  }

  static Future<List<dynamic>> getDistricts() async {
    await _init();
    return box!.get(keyDistrics) ?? [];
  }

  static Future addDistricts(List<DistrictModel> datas) async {
    await _init();
    box!.put(keyDistrics, datas.map((e) => e.toMap()).toList());
  }

  static Future<List<dynamic>> getCommune() async {
    await _init();
    return box!.get(keyCommunes) ?? [];
  }

  static Future addCommune(List<CommuneModel> datas) async {
    await _init();
    box!.put(keyCommunes, datas.map((e) => e.toMap()).toList());
  }
}
