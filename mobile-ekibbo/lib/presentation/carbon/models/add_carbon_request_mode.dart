import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/option_data.dart';

class AddCarbonRequestModel {
  FarmerModel? farmer;
  FarmLandModel? farmLand;
  CultivationModel? cultivation;

  OptionData? moisureContent;
  OptionData? methaneEmissionFactor;

  double? cultiavtionPeriod;
  OptionData? soilWet;
  OptionData? seedRate;
  OptionData? seedType;
  OptionData? pesticideUser;

  OptionData? preSeasonWater;
  OptionData? inSeasonWater;
  OptionData? timingOfStawInco;
  double? amountOfStawInco;
  OptionData? typeOrganic;
  double? amountOrganic;

  double? nRate;
  double? co2FromNFetilizer;
  OptionData? waterPump;
  OptionData? filedOperation;

  OptionData? harvestMethod;
  OptionData? strawManagement;
  OptionData? percentOfStraw;

  OptionData? dryingMethod;
  OptionData? storingMethod;

  OptionData? millingMethod;
  OptionData? ricePackaging;

  double? truck;
  double? tractor;
  double? localBoat;
  double? ship;

  double? saleMilRice;
  double? saleRiceHusk;
  double? saleRiceBran;
  double? saleRiceStraw;

  AddCarbonRequestModel();
  Map<String, dynamic> toJson() {
    final Map<String, dynamic> dataParent = {
      "farmer_id": farmer?.id,
      "farmland_id": farmLand?.id,
      "cultivation_id": cultivation?.id,
      'season_id': cultivation?.season?.id,
    };

    final Map<String, dynamic> data = <String, dynamic>{};
    data['est_yield'] = double.tryParse(cultivation?.estYield ?? '0');
    data['moisure_content'] = moisureContent?.value;
    data['methane_emission_factor'] = methaneEmissionFactor?.value;
    data['cultiavtion_period'] = cultiavtionPeriod ?? 0;
    data['soil_wet'] = soilWet?.value;
    data['seed_rate'] = seedRate?.value;
    data['seed_type'] = seedType?.value;
    data['pesticide_user'] = pesticideUser?.value;
    data['pre_season_water'] = preSeasonWater?.value;
    data['in_season_water'] = inSeasonWater?.value;
    data['timing_of_staw_inco'] = timingOfStawInco?.value;
    data['amount_of_staw_inco'] = amountOfStawInco ?? 0;
    data['type_organic'] = typeOrganic?.value;
    data['amount_organic'] = amountOrganic ?? 0;
    data['n_rate'] = nRate ?? 0;
    data['co2_from_n_fetilizer'] = co2FromNFetilizer ?? 0;
    data['water_pump'] = waterPump?.value;
    data['filed_operation'] = filedOperation?.value;
    data['harv_emission_potential'] = harvestMethod?.value;
    data['harv_grain_loss_rate'] = harvestMethod?.subValues?.first;
    data['straw_management'] = strawManagement?.value;
    data['percent_of_straw'] = percentOfStraw?.value;
    data['dry_emission_potential'] = dryingMethod?.value;
    data['dry_grain_loss_rate'] = dryingMethod?.subValues?.first;
    data['sto_emission_potential'] = storingMethod?.value;
    data['sto_grain_loss_rate'] = storingMethod?.subValues?.first;
    data['mil_emission_potential'] = millingMethod?.value;
    data['mil_grain_loss_rate'] = millingMethod?.subValues?[0];
    data['mil_rice_husk'] = millingMethod?.subValues?[1];
    data['mil_rice_bran'] = millingMethod?.subValues?[2];
    data['rice_pakaging'] = ricePackaging?.value;
    data['sale_mil_rice'] = saleMilRice ?? 0;
    data['sale_rice_husk'] = saleRiceHusk ?? 0;
    data['sale_rice_bran'] = saleRiceBran ?? 0;
    data['sale_rice_straw'] = saleRiceStraw ?? 0;
    data['truck'] = truck ?? 0;
    data['tractor'] = tractor ?? 0;
    data['local_boat'] = localBoat ?? 0;
    data['ship'] = ship ?? 0;
    dataParent['data_carbon_emmission'] = data;
    return dataParent;
  }
}
// {
//     "farmer_id":3822,
//     "farmland_id":1,
//     "cultivation_id":1,
//     "data_carbon_emmission":{
//         "est_yield":5,
//         "moisure_content":14,
//         "methane_emission_factor":1.22,
//         "cultiavtion_period":102,
//         "soil_wet":331,
//         "seed_rate":100,
//         "seed_type":1.12,
//         "pesticide_user":66.3,
//         "pre_season_water":1,
//         "in_season_water":1,
//         "timing_of_staw_inco":1,
//         "amount_of_staw_inco":0,
//         "type_organic":0.17,
//         "amount_organic":0,
//         "n_rate":100,
//         "co2_from_n_fetilizer":5.68,
//         "water_pump":97,
//         "filed_operation":240,
//         "harv_emission_potential":230,
//         "harv_grain_loss_rate":11.275,
//         "straw_management":0,
//         "percent_of_straw":100,
//         "dry_emission_potential":0,
//         "dry_grain_loss_rate":4,
//         "sto_emission_potential":11,
//         "sto_grain_loss_rate":7.5,
//         "mil_emission_potential":23,
//         "mil_grain_loss_rate":8,
//         "mil_rice_husk":20,
//         "mil_rice_bran":10,
//         "rice_pakaging":2,
//         "sale_mil_rice":900,
//         "sale_rice_husk":36,
//         "sale_rice_bran":100,
//         "sale_rice_straw":5,
//         "truck":100,
//         "tractor":50,
//         "local_boat":0,
//         "ship":0
//     }
// }