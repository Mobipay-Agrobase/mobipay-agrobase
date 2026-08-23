import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_address.dart';
import 'package:agrobase_ekibbo/models/distribution/model_cooperative.dart';

mixin DropCooperativeMixin {
  final List<MCooperative> cooperatives = [];
  int cooperativeId = 0;

  Future fetchCooperative() async {
    cooperatives.clear();
    cooperatives.addAll(await ApiAddress.getCooperatives());
    if(cooperatives.isEmpty) return;
  }

  indexCooperative() {
    if (cooperatives.isEmpty || cooperativeId == 0) return null;
    final index =
        cooperatives.indexWhere((element) => element.id == cooperativeId);
    if (index == -1) return null;
    return index;
  }
}
