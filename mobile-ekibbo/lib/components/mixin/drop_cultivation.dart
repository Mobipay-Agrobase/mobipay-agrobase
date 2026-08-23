import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_farmland.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';

mixin DropCultivationMixin {
  final List<CultivationModel> cultivations = [];
  int cultivationId = 0;
  String varietyName = '';

  fetchCultivation(int seasonId, int farmlandId, int cropId) async {
    cultivations.clear();
    cultivationId = 0;
    cultivations.addAll(await ApiFarmland.getCultivations(seasonId, farmlandId, cropId));
    if (cultivations.isEmpty) return;
  }

  indexCultivation() {
    if (cultivations.isEmpty || cultivationId == 0) return null;
    final index =
        cultivations.indexWhere((element) => element.id == cultivationId);
    if (index == -1) return null;
    return index;
  }
}
