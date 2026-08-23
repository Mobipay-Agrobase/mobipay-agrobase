import 'package:hive_flutter/hive_flutter.dart';
import 'package:agrobase_ekibbo/models/distribution/model_cooperative.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';

class BoxDropdown {
  static const String boxName = 'dropdown';

  static const String keyCooperatives = 'farmer_cooperatives';
  static const String keyIdentityProof = 'farmer_identity_proof';
  static const String keyEnrollmentPlace = 'farmer_enrollment_place';
  static const String keyGender = 'farmer_gender';


  static const String keyLandApproachRoad = 'farmland_approach_road';
  static const String keyLandTopology = 'farmland_land_topology';
  static const String keyLandGradient = 'farmland_land_gradient';
  static const String keyLandOwnerShip = 'farmland_land_owner_ship';
  static const String keyLandDocument = 'farmland_land_document';

  //cropInformation
  static const String keyCropInformation = 'crop_information';


  static Box? box;
  static Future _init() async {
    if (box != null) return;
    box = await Hive.openBox(boxName);
  }

  static Future<List<dynamic>> getCooperatives() async {
    await _init();
    return box!.get(keyCooperatives) ?? [];
  }
  static Future addCooperatives(List<MCooperative> datas) async {
    await _init();
    box!.put(keyCooperatives, datas.map((e) => e.toMap()).toList());
  }

  static Future<List<dynamic>> getIdentityProof() async {
    await _init();
    return box!.get(keyIdentityProof) ?? [];
  }
  static Future addIdentityProof(List<DropdownDataModel> datas) async {
    await _init();
    box!.put(keyIdentityProof, datas.map((e) => e.toJson()).toList());
  }

  static Future<List<dynamic>> getEnrollmentPlace() async {
    await _init();
    return box!.get(keyEnrollmentPlace) ?? [];
  }
  static Future addEnrollmentPlace(List<DropdownDataModel> datas) async {
    await _init();
    box!.put(keyEnrollmentPlace, datas.map((e) => e.toJson()).toList());
  }

  static Future<List<dynamic>> getGender() async {
    await _init();
    return box!.get(keyGender) ?? [];
  }
  static Future addGender(List<DropdownDataModel> datas) async {
    await _init();
    box!.put(keyGender, datas.map((e) => e.toJson()).toList());
  }

  static Future<List<dynamic>> getLandApproachRoad() async {
    await _init();
    return box!.get(keyLandApproachRoad) ?? [];
  }
  static Future addLandApproachRoad(List<DropdownDataModel> datas) async {
    await _init();
    box!.put(keyLandApproachRoad, datas.map((e) => e.toJson()).toList());
  }

  static Future<List<dynamic>> getLandTopology() async {
    await _init();
    return box!.get(keyLandTopology) ?? [];
  }
  static Future addLandTopology(List<DropdownDataModel> datas) async {
    await _init();
    box!.put(keyLandTopology, datas.map((e) => e.toJson()).toList());
  }

  static Future<List<dynamic>> getLandGradient() async {
    await _init();
    return box!.get(keyLandGradient) ?? [];
  }
  static Future addLandGradient(List<DropdownDataModel> datas) async {
    await _init();
    box!.put(keyLandGradient, datas.map((e) => e.toJson()).toList());
  }

  static Future<List<dynamic>> getLandOwnerShip() async {
    await _init();
    return box!.get(keyLandOwnerShip) ?? [];
  }
  static Future addLandOwnerShip(List<DropdownDataModel> datas) async {
    await _init();
    box!.put(keyLandOwnerShip, datas.map((e) => e.toJson()).toList());
  }

  static Future<List<dynamic>> getLandDocument() async {
    await _init();
    return box!.get(keyLandDocument) ?? [];
  }
  static Future addLandDocument(List<DropdownDataModel> datas) async {
    await _init();
    box!.put(keyLandDocument, datas.map((e) => e.toJson()).toList());
  }

  static Future<List<dynamic>> getCropInformation() async {
    await _init();
    return box!.get(keyCropInformation) ?? [];
  }
  static Future addCropInformation(List<DropdownMasterModel> datas) async {
    await _init();
    box!.put(keyCropInformation, datas.map((e) => e.toJson()).toList());
  }
  
}
