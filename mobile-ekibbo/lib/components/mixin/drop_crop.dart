import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_crop.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';

mixin DropCropMixin {
  final List<SeasonModel> seasons = [];
  int seasonId = 0;

  final List<DropdownMasterModel> cropInformations = [];
  int cropInformationId = 0;

  Future fetchDropSeason() async {
    seasons.clear();
    final res = await ApiCrop.getDataDropDownCrop();
    if (res == null) return;
    seasons.addAll(res.season ?? []);
  }

  Future fetchCropInformation(int farmlandId) async {
    cropInformations.clear();
    final res = await ApiCrop.fetchCropCutivated(farmlandId, seasonId);
    if (res == null) return;
    cropInformations.addAll(res.cropInformation ?? []);
  }

  indexSeason() {
    if (seasons.isEmpty || seasonId == 0) return null;
    final index = seasons.indexWhere((element) => element.id == seasonId);
    if (index == -1) return null;
    return index;
  }

  indexCropInformation() {
    if (cropInformations.isEmpty || cropInformationId == 0) return null;
    final index = cropInformations
        .indexWhere((element) => element.id == cropInformationId);
    if (index == -1) return null;
    return index;
  }

  setSeasons(List<SeasonModel> datas) {
    seasons.clear();
    seasons.addAll(datas);
  }

  setCropInformations(List<DropdownMasterModel> datas) {
    cropInformations.clear();
    cropInformations.addAll(datas);
  }
}
