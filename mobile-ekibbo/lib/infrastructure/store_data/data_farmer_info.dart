import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_farmer.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_farmland.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/user_info.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/animal_husbandry/animal_husbandry_response.dart';
import 'package:agrobase_ekibbo/models/asset_info/asset_info_model.dart';
import 'package:agrobase_ekibbo/models/bank_info/bank_info_model.dart';
import 'package:agrobase_ekibbo/models/certificate/certificate_response.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/family_info/family_info_model.dart';
import 'package:agrobase_ekibbo/models/farm_equipment/farm_equipment_response.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/models/finance_info/finance_info_model.dart';
import 'package:agrobase_ekibbo/models/insurance/insurance_info_response.dart';

class DFarmerInfo {
  DFarmerInfo._privateConstructor();
  static final DFarmerInfo instance = DFarmerInfo._privateConstructor();

  FamilyInfoModel? infoFamily;
  AssetInfoModel? infoAsset;
  FinanceInfoModel? infoFinance;
  CertificateModel? infoCert;
  List<BankInfoModel>? infoBanks;
  List<InsuranceInfoModel>? infoInsurances;
  List<FarmEquipmentModel>? infoEquipments;
  List<AnimalHusbandryModel>? infoAnimals;
  List<DropdownMasterModel>? dataCrop;

  //role farmer
  List<FarmLandModel>? farmlands;
  FarmerModel? farmer;

  fetchDataInfoInsurances(int farmerId) async {
    try {
      if (infoInsurances == null) {
        final res =
            await ApiProvider.instance.apiFarmer.getInsuranceData(farmerId);
        infoInsurances = res?.data?.insuranceInfo ?? [];
        dataCrop = res?.data?.dataCrop ?? [];
      }
      return infoInsurances;
    } catch (e) {
      throw Exception();
    }
  }

  Future<List<FarmLandModel>> fetchDataFarmland(int farmerId) async {
    try {
      farmlands ??= await ApiFarmland.getFarmlandByFarmerId(farmerId);
      fetchDataFarmerInfo();
      return farmlands!;
    } catch (e) {
      return [];
    }
  }

  fetchDataFarmerInfo() async {
    if (DUserInfo.instance.user == null) return;
    farmer ??= await ApiFarmer.getFarmerDetailRoleFarmer();
  }

  fetchFarmLandFullInfo() async {
    if (farmlands == null) return;
    if (farmlands!.isEmpty) return;
    for (var farm in farmlands!) {
      ApiFarmland.getDetailFarmland(farm.id!);
    }
  }

  clearData() {
    infoFamily = null;
    infoAsset = null;
    infoFinance = null;
    infoCert = null;
    infoBanks = null;
    infoInsurances = null;
    infoEquipments = null;
    infoAnimals = null;
    dataCrop = null;
  }
}
