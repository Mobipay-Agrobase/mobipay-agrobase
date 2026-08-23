import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_procurement.dart';
import 'package:agrobase_ekibbo/models/crop/crop_harvest_model.dart';

mixin DropCropHarvestMixin {
  final List<MCropHarvest> cropHarvests = [];
  int cropHarvestId = 0;

  Future fetchCropHarvest() async {
    cropHarvests.clear();
    final res = await ApiProcurement.fetchCropHarvest();
    cropHarvests.addAll(res);
  }

  indexCropHarvest() {
    if (cropHarvests.isEmpty || cropHarvestId == 0) return null;
    final index =
        cropHarvests.indexWhere((element) => element.id == cropHarvestId);
    if (index == -1) return null;
    return index;
  }
}
