import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_farmland.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';

mixin DropFarmLandMixin {
  final List<FarmLandModel> farmlands = [];
  int farmlandId = 0;

  Future fetchFarmland(int farmerId) async {
    farmlands.clear();
    farmlandId = 0;
    farmlands.addAll(await ApiFarmland.getFarmlandByFarmerId(farmerId));
    if(farmlands.isEmpty) return;
  }

  indexFarmland() {
    if (farmlands.isEmpty || farmlandId == 0) return null;
    final index = farmlands.indexWhere((element) => element.id == farmlandId);
    if (index == -1) return null;
    return index;
  }
}
